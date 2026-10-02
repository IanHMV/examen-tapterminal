<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

/**
 * Bitácora del sistema: consulta de los cambios (solo lectura).
 */
class AuditLogController extends Controller
{
    /** Registros por página. */
    private const PER_PAGE = 10;

    #[OA\Get(
        path: '/api/v1/audit-logs',
        operationId: 'listAuditLogs',
        summary: 'Consultar la bitácora',
        description: 'Altas, ediciones y eliminaciones de productos, perfiles y usuarios, del cambio más reciente '
            . 'al más antiguo, en páginas de 10. Cada registro trae los datos antes y después del cambio.',
        tags: ['Bitácora'],
        parameters: [
            new OA\Parameter(
                name: 'entity',
                in: 'query',
                required: false,
                description: 'Solo los cambios de esta entidad.',
                schema: new OA\Schema(type: 'string', enum: AuditLog::ENTITIES)
            ),
            new OA\Parameter(
                name: 'code',
                in: 'query',
                required: false,
                description: 'Solo los cambios de este registro. No distingue mayúsculas.',
                schema: new OA\Schema(type: 'string', example: 'PRD-0001')
            ),
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
                description: 'Una página de la bitácora.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/AuditLog')
                        ),
                        new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks'),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Un filtro no es válido.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ValidationError',
                    example: [
                        'message' => 'El valor de entidad no es válido.',
                        'errors' => ['entity' => ['El valor de entidad no es válido.']],
                    ]
                )
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'entity' => ['nullable', 'string', Rule::in(AuditLog::ENTITIES)],
            'code' => ['nullable', 'string', 'max:20'],
        ]);

        $logs = AuditLog::query()
            ->when($filters['entity'] ?? null, fn ($query, string $entity) => $query->where('entity', $entity))
            ->when($filters['code'] ?? null, fn ($query, string $code) => $query->where('entity_code', Str::upper(trim($code))))
            ->latest()
            ->paginate(self::PER_PAGE)
            // Los enlaces de página conservan los filtros.
            ->withQueryString();

        return AuditLogResource::collection($logs);
    }
}
