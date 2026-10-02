<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\ProfilesExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\ExportRequest;
use App\Http\Requests\StoreProfileRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Models\User;
use App\Support\TableExporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        return ProfileResource::collection(Profile::query()->latest()->paginate(self::PER_PAGE));
    }

    #[OA\Get(
        path: '/api/v1/profiles/export',
        operationId: 'exportProfiles',
        summary: 'Exportar perfiles a Excel o PDF',
        description: 'Todos los perfiles con sus secciones, del más reciente al más antiguo. Las fechas salen como DD/MM/YYYY HH:MM.',
        tags: ['Perfiles'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/ExportFormat'),
            new OA\Parameter(ref: '#/components/parameters/ExportTimezone'),
        ],
        responses: [
            new OA\Response(ref: '#/components/responses/ExportFile', response: 200),
            new OA\Response(ref: '#/components/responses/ExportValidationError', response: 422),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function export(ExportRequest $request, TableExporter $exporter): StreamedResponse|Response
    {
        return $exporter->download(new ProfilesExport(), $request->exportFormat(), $request->timezone());
    }

    #[OA\Get(
        path: '/api/v1/profiles/options',
        operationId: 'listProfileOptions',
        summary: 'Opciones de perfiles',
        description: 'Todos los perfiles (código y nombre), ordenados por nombre, para el formulario de usuarios.',
        tags: ['Perfiles'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista completa, sin paginar.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'code', type: 'string', example: 'PRF-0001'),
                                    new OA\Property(property: 'name', type: 'string', example: 'Administrador'),
                                ],
                                type: 'object'
                            )
                        ),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function options(): JsonResponse
    {
        // Solo los campos necesarios: es una lista corta para casillas de selección.
        $profiles = Profile::query()->orderBy('name')->get(['code', 'name']);

        return response()->json([
            'data' => $profiles->map(fn (Profile $profile) => ['code' => $profile->code, 'name' => $profile->name]),
        ]);
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
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
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
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
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
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
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
        description: 'Borra el perfil de forma permanente. Su código no se vuelve a asignar. '
            . 'No se puede borrar si está asignado a algún usuario.',
        tags: ['Perfiles'],
        parameters: [new OA\Parameter(ref: '#/components/parameters/ProfileCode')],
        responses: [
            new OA\Response(response: 204, description: 'Perfil eliminado (sin contenido).'),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(
                response: 409,
                description: 'El perfil está asignado a usuarios.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'message',
                            type: 'string',
                            example: 'No se puede eliminar: el perfil está asignado a 2 usuario(s).'
                        ),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function destroy(Profile $profile): Response|JsonResponse
    {
        // Usa el índice multikey de users.profile_codes.
        $assignedUsers = User::query()->where('profile_codes', $profile->code)->count();

        if ($assignedUsers > 0) {
            return response()->json([
                'message' => "No se puede eliminar: el perfil está asignado a {$assignedUsers} usuario(s).",
            ], Response::HTTP_CONFLICT);
        }

        $profile->delete();

        return response()->noContent();
    }
}
