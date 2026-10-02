<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

/**
 * Inicio y cierre de sesión con tokens de Laravel Sanctum, y recuperación de contraseña.
 */
class AuthController extends Controller
{
    /**
     * Hash bcrypt de una contraseña aleatoria que nadie conoce. Se compara contra él
     * cuando el correo no existe: así la respuesta tarda lo mismo que con un correo
     * real y nadie puede averiguar qué correos están registrados midiendo el tiempo.
     */
    private const DUMMY_HASH = '$2y$12$BoaDK341riDzJIpxqbm74emehdwbi3cwgtHRFla0vLMjxti/smulW';

    private const FORGOT_PASSWORD_MESSAGE = 'Te enviamos un enlace a tu correo para elegir una contraseña nueva. '
        . 'Revisa tu bandeja de entrada.';

    private const USER_NOT_FOUND_MESSAGE = 'Usuario no encontrado, no es posible enviar el correo.';

    private const LINK_ALREADY_SENT_MESSAGE = 'Ya te enviamos un enlace hace menos de un minuto. '
        . 'Revisa tu correo o espera un momento para pedir otro.';

    private const INVALID_RESET_LINK_MESSAGE = 'El enlace no es válido o ya venció. Pide uno nuevo.';

    #[OA\Post(
        path: '/api/v1/auth/login',
        operationId: 'login',
        summary: 'Iniciar sesión',
        description: 'Devuelve un token Bearer que vence en 8 horas. En Swagger, cópialo en "Authorize". '
            . 'Máximo 5 intentos por minuto para cada correo.',
        security: [],
        tags: ['Sesión'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/LoginInput')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sesión iniciada.',
                content: new OA\JsonContent(
                    required: ['token', 'token_type', 'expires_at', 'user'],
                    properties: [
                        new OA\Property(
                            property: 'token',
                            type: 'string',
                            example: '1|Xg3k9…',
                            description: 'Se envía en cada petición: Authorization: Bearer <token>.'
                        ),
                        new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                        new OA\Property(property: 'expires_at', type: 'string', format: 'date-time', example: '2026-10-02T02:30:00+00:00'),
                        new OA\Property(property: 'user', ref: '#/components/schemas/AuthUser'),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Correo o contraseña incorrectos (el mensaje no dice cuál, a propósito).',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ValidationError',
                    example: [
                        'message' => 'El correo o la contraseña no son correctos.',
                        'errors' => ['email' => ['El correo o la contraseña no son correctos.']],
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/TooManyRequests', response: 429),
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', Str::lower($request->string('email')))->first();

        // Se compara siempre (aunque el correo no exista) para que tarde lo mismo.
        $passwordMatches = Hash::check($request->string('password'), $user?->password ?? self::DUMMY_HASH);

        if ($user === null || ! $passwordMatches) {
            // Mismo mensaje en ambos casos: no revela si el correo está registrado.
            throw ValidationException::withMessages([
                'email' => 'El correo o la contraseña no son correctos.',
            ]);
        }

        $expiresAt = now()->addMinutes(config('sanctum.expiration'));
        $token = $user->createToken('angular', ['*'], $expiresAt);

        return response()->json([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => AuthUserResource::make($user),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/auth/me',
        operationId: 'me',
        summary: 'Usuario actual',
        description: 'Datos del usuario dueño del token, con sus perfiles y las secciones a las que tiene acceso.',
        tags: ['Sesión'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'El usuario con sesión iniciada.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/AuthUser'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
        ]
    )]
    public function me(Request $request): AuthUserResource
    {
        return AuthUserResource::make($request->user());
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        operationId: 'logout',
        summary: 'Cerrar sesión',
        description: 'Revoca (borra) el token con el que se hizo la petición. Ya no sirve aunque alguien lo haya copiado.',
        tags: ['Sesión'],
        responses: [
            new OA\Response(response: 204, description: 'Sesión cerrada (sin contenido).'),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
        ]
    )]
    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    #[OA\Post(
        path: '/api/v1/auth/forgot-password',
        operationId: 'forgotPassword',
        summary: 'Pedir un enlace para restablecer la contraseña',
        description: 'Envía al correo un enlace de un solo uso que vence en 60 minutos. Si el correo no está '
            . 'registrado responde 422. Máximo 5 solicitudes por minuto desde cada IP, y un enlace por minuto '
            . 'para cada correo.',
        security: [],
        tags: ['Sesión'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ForgotPasswordInput')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Enlace enviado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: self::FORGOT_PASSWORD_MESSAGE),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'El correo no está registrado o no tiene un formato válido.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ValidationError',
                    examples: [
                        new OA\Examples(
                            example: 'no-registrado',
                            summary: 'Usuario no encontrado',
                            value: [
                                'message' => self::USER_NOT_FOUND_MESSAGE,
                                'errors' => ['email' => [self::USER_NOT_FOUND_MESSAGE]],
                            ]
                        ),
                        new OA\Examples(
                            example: 'formato',
                            summary: 'Correo con formato inválido',
                            value: [
                                'message' => 'El campo correo debe ser un correo electrónico válido.',
                                'errors' => ['email' => ['El campo correo debe ser un correo electrónico válido.']],
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 429,
                description: 'Ya se envió un enlace a ese correo hace menos de un minuto, o demasiadas solicitudes '
                    . 'desde la misma IP (encabezado Retry-After).',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: self::LINK_ALREADY_SENT_MESSAGE),
                    ]
                )
            ),
        ]
    )]
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');
        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            throw ValidationException::withMessages(['email' => self::USER_NOT_FOUND_MESSAGE]);
        }

        // El broker genera como máximo un enlace por minuto para cada correo ("throttle" en config/auth.php).
        if (Password::getRepository()->recentlyCreatedToken($user)) {
            return response()->json(['message' => self::LINK_ALREADY_SENT_MESSAGE], 429);
        }

        // Se envía después de responder (defer): la respuesta no espera al servidor de correo
        // y, si este falla, el error queda en el log.
        defer(fn () => Password::sendResetLink(['email' => $email]));

        return response()->json(['message' => self::FORGOT_PASSWORD_MESSAGE]);
    }

    #[OA\Post(
        path: '/api/v1/auth/reset-password',
        operationId: 'resetPassword',
        summary: 'Elegir una contraseña nueva con el enlace del correo',
        description: 'Sirve para la recuperación y para el correo de bienvenida. El enlace solo funciona una vez y, '
            . 'al cambiar la contraseña, se cierran todas las sesiones abiertas del usuario.',
        security: [],
        tags: ['Sesión'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ResetPasswordInput')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Contraseña actualizada.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'message',
                            type: 'string',
                            example: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.'
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'El enlace no es válido o venció (error en "token"), o la contraseña no cumple las reglas.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ValidationError',
                    examples: [
                        new OA\Examples(
                            example: 'enlace',
                            summary: 'Enlace vencido, ya usado o de otro correo',
                            value: [
                                'message' => self::INVALID_RESET_LINK_MESSAGE,
                                'errors' => ['token' => [self::INVALID_RESET_LINK_MESSAGE]],
                            ]
                        ),
                        new OA\Examples(
                            example: 'contrasena',
                            summary: 'Contraseña débil o sin confirmar',
                            value: [
                                'message' => 'El campo contraseña debe contener al menos un número. (y 1 error más)',
                                'errors' => [
                                    'password' => [
                                        'El campo contraseña debe contener al menos un número.',
                                        'La confirmación de la contraseña no coincide.',
                                    ],
                                ],
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/TooManyRequests', response: 429),
        ]
    )]
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->safe()->only(['email', 'password', 'password_confirmation', 'token']),
            function (User $user, string $password) {
                $user->password = $password;
                $user->save();

                // Cierra todas sus sesiones: si alguien más tenía un token, deja de servir.
                $user->tokens()->delete();
            },
        );

        // Correo inexistente, enlace vencido o ya usado: el mismo mensaje, no revela cuál fue.
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => self::INVALID_RESET_LINK_MESSAGE]);
        }

        return response()->json(['message' => 'Tu contraseña se actualizó. Ya puedes iniciar sesión.']);
    }
}
