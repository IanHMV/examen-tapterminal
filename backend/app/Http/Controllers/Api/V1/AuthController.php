<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

/**
 * Inicio y cierre de sesión con tokens de Laravel Sanctum.
 */
class AuthController extends Controller
{
    /**
     * Hash bcrypt de una contraseña aleatoria que nadie conoce. Se compara contra él
     * cuando el correo no existe: así la respuesta tarda lo mismo que con un correo
     * real y nadie puede averiguar qué correos están registrados midiendo el tiempo.
     */
    private const DUMMY_HASH = '$2y$12$BoaDK341riDzJIpxqbm74emehdwbi3cwgtHRFla0vLMjxti/smulW';

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
            new OA\Response(
                response: 429,
                description: 'Demasiados intentos.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Demasiados intentos. Intenta de nuevo en 60 segundos.'),
                    ]
                )
            ),
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
}
