<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

/**
 * Reporta si la API está en funcionamiento.
 *
 * No expone versiones de software para no facilitar el reconocimiento a un atacante.
 */
class HealthcheckController extends Controller
{
    #[OA\Get(
        path: '/api/v1/healthcheck',
        operationId: 'healthcheck',
        summary: 'Estado de la API',
        description: 'Indica si la API está en funcionamiento. No requiere autenticación.',
        tags: ['Sistema'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'La API está en funcionamiento.',
                content: new OA\JsonContent(
                    required: ['status', 'service', 'timestamp'],
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'ok'),
                        new OA\Property(property: 'service', type: 'string', example: 'Examen TAP Terminal'),
                        new OA\Property(
                            property: 'timestamp',
                            type: 'string',
                            format: 'date-time',
                            example: '2026-09-30T06:41:22+00:00'
                        ),
                    ]
                )
            ),
        ]
    )]
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => config('app.name'),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
