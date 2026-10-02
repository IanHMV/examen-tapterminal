<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProfileRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

/**
 * Perfiles de usuario y las secciones a las que dan acceso.
 */
#[OA\Parameter(
    parameter: 'ProfileCode',
    name: 'code',
    in: 'path',
    required: true,
    description: 'Código del perfil.',
    schema: new OA\Schema(type: 'string', example: 'PRF-0001')
)]
#[OA\Response(
    response: 'ProfileValidationError',
    description: 'Los datos no son válidos.',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ValidationError',
        example: [
            'message' => 'El campo nombre ya ha sido registrado. (y 1 error más)',
            'errors' => [
                'name' => ['El campo nombre ya ha sido registrado.'],
                'sections' => ['Selecciona al menos una sección.'],
            ],
        ]
    )
)]
class ProfileController extends Controller
{
    /** Perfiles por página en el listado. */
    private const PER_PAGE = 10;

    #[OA\Get(
        path: '/api/v1/profiles',
        operationId: 'listProfiles',
        summary: 'Listar perfiles',
        description: 'Devuelve los perfiles del más reciente al más antiguo, en páginas de 10.',
        tags: ['Perfiles'],
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
                description: 'Una página de perfiles.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/Profile')
                        ),
                        new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks'),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        return ProfileResource::collection(Profile::query()->latest()->paginate(self::PER_PAGE));
    }

    #[OA\Post(
        path: '/api/v1/profiles',
        operationId: 'storeProfile',
        summary: 'Crear un perfil',
        description: 'Registra un perfil con sus secciones. El código (PRF-0001) y la fecha los genera el sistema.',
        tags: ['Perfiles'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ProfileInput')
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Perfil creado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Profile'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/ProfileValidationError', response: 422),
        ]
    )]
    public function store(StoreProfileRequest $request): JsonResponse
    {
        $profile = Profile::create($request->validated());

        return ProfileResource::make($profile)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    #[OA\Get(
        path: '/api/v1/profiles/{code}',
        operationId: 'showProfile',
        summary: 'Ver un perfil',
        description: 'Busca el perfil por su código (PRF-0001).',
        tags: ['Perfiles'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProfileCode')],
        responses: [
            new OA\Response(
                response: 200,
                description: 'El perfil con sus secciones.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Profile'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function show(Profile $profile): ProfileResource
    {
        return ProfileResource::make($profile);
    }

    #[OA\Put(
        path: '/api/v1/profiles/{code}',
        operationId: 'updateProfile',
        summary: 'Editar un perfil',
        description: 'Reemplaza el nombre y las secciones. El código y la fecha de creación no cambian.',
        tags: ['Perfiles'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProfileCode')],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ProfileInput')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Perfil actualizado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Profile'),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/ProfileValidationError', response: 422),
        ]
    )]
    public function update(UpdateProfileRequest $request, Profile $profile): ProfileResource
    {
        $profile->update($request->validated());

        return ProfileResource::make($profile);
    }

    #[OA\Delete(
        path: '/api/v1/profiles/{code}',
        operationId: 'deleteProfile',
        summary: 'Eliminar un perfil',
        description: 'Borra el perfil de forma permanente. Su código no se vuelve a asignar.',
        tags: ['Perfiles'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProfileCode')],
        responses: [
            new OA\Response(response: 204, description: 'Perfil eliminado (sin contenido).'),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function destroy(Profile $profile): Response
    {
        $profile->delete();

        return response()->noContent();
    }
}
