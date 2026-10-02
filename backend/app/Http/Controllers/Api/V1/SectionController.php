<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Section;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

/**
 * Catálogo de secciones del sistema (las opciones del formulario de perfiles).
 */
#[OA\Schema(
    schema: 'Section',
    required: ['key', 'name'],
    properties: [
        new OA\Property(property: 'key', ref: '#/components/schemas/SectionKey', description: 'Clave de la sección.'),
        new OA\Property(property: 'name', type: 'string', example: 'Productos'),
    ],
    type: 'object'
)]
class SectionController extends Controller
{
    #[OA\Get(
        path: '/api/v1/sections',
        operationId: 'listSections',
        summary: 'Listar secciones',
        description: 'Secciones del sistema que se pueden asignar a un perfil.',
        tags: ['Perfiles'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Catálogo de secciones.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/Section')
                        ),
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => array_map(fn (Section $section) => $section->toArray(), Section::cases()),
        ]);
    }
}
