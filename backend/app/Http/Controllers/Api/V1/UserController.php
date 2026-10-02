<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserPhotoRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserDetailResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\PhotoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

/**
 * Usuarios del sistema: datos, foto de perfil (GridFS) y perfiles asignados.
 */
#[OA\Parameter(
    parameter: 'UserCode',
    name: 'code',
    in: 'path',
    required: true,
    description: 'Código del usuario.',
    schema: new OA\Schema(type: 'string', example: 'USR-0001')
)]
#[OA\Response(
    response: 'UserValidationError',
    description: 'Los datos no son válidos.',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ValidationError',
        example: [
            'message' => 'El campo correo ya ha sido registrado. (y 1 error más)',
            'errors' => [
                'email' => ['El campo correo ya ha sido registrado.'],
                'phone' => ['El teléfono debe incluir la lada del país, por ejemplo +52 314 123 4567.'],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'UserDetailData',
    description: 'El usuario con sus perfiles.',
    content: new OA\JsonContent(
        properties: [
            new OA\Property(property: 'data', ref: '#/components/schemas/UserDetail'),
        ]
    )
)]
class UserController extends Controller
{
    /** Usuarios por página en el listado. */
    private const PER_PAGE = 10;

    public function __construct(private readonly PhotoStorage $photos)
    {
    }

    #[OA\Get(
        path: '/api/v1/users',
        operationId: 'listUsers',
        summary: 'Listar usuarios',
        description: 'Devuelve los usuarios del más reciente al más antiguo, en páginas de 10.',
        tags: ['Usuarios'],
        parameters: [
            new OA\Parameter(
                name: 'page',
                in: 'query',
                required: false,
                description: 'Número de página (empieza en 1).',
                schema: new OA\Schema(type: 'integer', minimum: 1, example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Una página de usuarios.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/User')),
                        new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks'),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::query()->latest()->paginate(self::PER_PAGE));
    }

    #[OA\Post(
        path: '/api/v1/users',
        operationId: 'storeUser',
        summary: 'Crear un usuario',
        description: 'Registra un usuario con su foto (multipart/form-data). El código, la fecha y una contraseña '
            . 'aleatoria los genera el sistema; el usuario recibe sus credenciales por correo.',
        tags: ['Usuarios'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['name', 'email', 'profile_codes[]', 'photo'],
                    properties: [
                        new OA\Property(property: 'name', type: 'string', example: 'Ana López'),
                        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'ana.lopez@tapterminal.com'),
                        new OA\Property(property: 'phone', type: 'string', example: '+52 314 123 4567'),
                        new OA\Property(
                            property: 'profile_codes[]',
                            type: 'array',
                            items: new OA\Items(type: 'string'),
                            example: ['PRF-0002']
                        ),
                        new OA\Property(property: 'photo', type: 'string', format: 'binary', description: 'JPG, PNG o WebP; máximo 2 MB.'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Usuario creado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserDetail'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/UserValidationError', response: 422),
        ]
    )]
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = new User($request->safe()->except('photo'));

        // El alta del examen no tiene contraseña: se genera una aleatoria que nadie ve
        // (se guarda cifrada). El usuario obtiene sus credenciales por correo (TICK-21).
        $user->password = Str::password(16);
        $user->photo_id = $this->photos->store($request->file('photo'));

        try {
            $user->save();
        } catch (Throwable $exception) {
            // Si el usuario no se guardó, su foto no debe quedarse huérfana en GridFS.
            $this->photos->delete($user->photo_id);

            throw $exception;
        }

        return UserDetailResource::make($user)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    #[OA\Get(
        path: '/api/v1/users/{code}',
        operationId: 'showUser',
        summary: 'Ver un usuario',
        description: 'Datos del usuario con la lista de sus perfiles.',
        tags: ['Usuarios'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/UserCode')],
        responses: [
            new OA\Response(ref: '#/components/responses/UserDetailData', response: 200),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function show(User $user): UserDetailResource
    {
        return UserDetailResource::make($user);
    }

    #[OA\Put(
        path: '/api/v1/users/{code}',
        operationId: 'updateUser',
        summary: 'Editar un usuario',
        description: 'Reemplaza nombre, correo, teléfono y perfiles (JSON). La foto se cambia con POST /users/{code}/photo.',
        tags: ['Usuarios'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/UserCode')],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserInput')
        ),
        responses: [
            new OA\Response(ref: '#/components/responses/UserDetailData', response: 200),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/UserValidationError', response: 422),
        ]
    )]
    public function update(UpdateUserRequest $request, User $user): UserDetailResource
    {
        $user->update($request->validated());

        return UserDetailResource::make($user);
    }

    #[OA\Delete(
        path: '/api/v1/users/{code}',
        operationId: 'deleteUser',
        summary: 'Eliminar un usuario',
        description: 'Borra el usuario y su foto de forma permanente. Su código no se vuelve a asignar.',
        tags: ['Usuarios'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/UserCode')],
        responses: [
            new OA\Response(response: 204, description: 'Usuario eliminado (sin contenido).'),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function destroy(User $user): Response
    {
        $user->delete();
        $this->photos->delete($user->photo_id);

        return response()->noContent();
    }

    #[OA\Get(
        path: '/api/v1/users/{code}/photo',
        operationId: 'showUserPhoto',
        summary: 'Foto de perfil',
        description: 'Devuelve la imagen guardada en GridFS. No usa token: se pide con la URL firmada de "photo_url".',
        security: [],
        tags: ['Usuarios'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/UserCode'),
            new OA\Parameter(name: 'v', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'expires', in: 'query', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'signature', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'La imagen (JPG, PNG o WebP).',
                content: [
                    new OA\MediaType(mediaType: 'image/jpeg', schema: new OA\Schema(type: 'string', format: 'binary')),
                    new OA\MediaType(mediaType: 'image/png', schema: new OA\Schema(type: 'string', format: 'binary')),
                    new OA\MediaType(mediaType: 'image/webp', schema: new OA\Schema(type: 'string', format: 'binary')),
                ]
            ),
            new OA\Response(
                response: 403,
                description: 'La firma no es válida o la URL ya venció.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'El enlace no es válido o ya venció.'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function photo(User $user): StreamedResponse
    {
        $photo = $this->photos->open($user->photo_id);

        abort_if($photo === null, Response::HTTP_NOT_FOUND);

        return response()->stream(fn () => fpassthru($photo['stream']), Response::HTTP_OK, [
            'Content-Type' => $photo['contentType'],
            'Content-Length' => (string) $photo['length'],
            // La URL firmada vence en 1 o 2 horas: el navegador puede guardarla una hora.
            'Cache-Control' => 'private, max-age=3600',
            // El navegador no debe "adivinar" otro tipo de archivo.
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    #[OA\Post(
        path: '/api/v1/users/{code}/photo',
        operationId: 'updateUserPhoto',
        summary: 'Cambiar la foto de perfil',
        description: 'Reemplaza la foto (multipart/form-data). La foto anterior se borra de GridFS.',
        tags: ['Usuarios'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/UserCode')],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['photo'],
                    properties: [
                        new OA\Property(property: 'photo', type: 'string', format: 'binary', description: 'JPG, PNG o WebP; máximo 2 MB.'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(ref: '#/components/responses/UserDetailData', response: 200),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/UserValidationError', response: 422),
        ]
    )]
    public function updatePhoto(UpdateUserPhotoRequest $request, User $user): UserDetailResource
    {
        $previous = $user->photo_id;

        $user->photo_id = $this->photos->store($request->file('photo'));
        $user->save();

        $this->photos->delete($previous);

        return UserDetailResource::make($user);
    }
}
