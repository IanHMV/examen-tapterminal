<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Throwable;

/**
 * Reporta si la API y su base de datos están en funcionamiento.
 *
 * Responde 200 si todo está bien y 503 si MongoDB no responde, para que
 * Docker (TICK-09) pueda detectar el problema. No expone versiones de
 * software para no facilitar el reconocimiento a un atacante.
 */
#[OA\Schema(
    schema: 'Healthcheck',
    required: ['status', 'service', 'checks', 'timestamp'],
    properties: [
        new OA\Property(
            property: 'status',
            type: 'string',
            enum: ['ok', 'degraded'],
            example: 'ok',
            description: 'degraded: la API funciona, pero la base de datos no responde.'
        ),
        new OA\Property(property: 'service', type: 'string', example: 'Examen TAP Terminal'),
        new OA\Property(
            property: 'checks',
            required: ['database'],
            properties: [
                new OA\Property(property: 'database', type: 'string', enum: ['ok', 'error'], example: 'ok'),
            ],
            type: 'object'
        ),
        new OA\Property(
            property: 'timestamp',
            type: 'string',
            format: 'date-time',
            example: '2026-10-01T06:41:22+00:00'
        ),
    ],
    type: 'object'
)]
class HealthcheckController extends Controller
{
    #[OA\Get(
        path: '/api/v1/healthcheck',
        operationId: 'healthcheck',
        summary: 'Estado de la API',
        description: 'Indica si la API y su base de datos están en funcionamiento. No requiere autenticación.',
        tags: ['Sistema'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'La API y la base de datos están en funcionamiento.',
                content: new OA\JsonContent(ref: '#/components/schemas/Healthcheck')
            ),
            new OA\Response(
                response: 503,
                description: 'La API funciona, pero la base de datos no responde.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/Healthcheck',
                    example: [
                        'status' => 'degraded',
                        'service' => 'Examen TAP Terminal',
                        'checks' => ['database' => 'error'],
                        'timestamp' => '2026-10-01T06:41:22+00:00',
                    ]
                )
            ),
        ]
    )]
    public function __invoke(): JsonResponse
    {
        $databaseIsUp = $this->databaseIsUp();

        return response()->json([
            'status' => $databaseIsUp ? 'ok' : 'degraded',
            'service' => config('app.name'),
            'checks' => [
                'database' => $databaseIsUp ? 'ok' : 'error',
            ],
            'timestamp' => now()->toIso8601String(),
        ], $databaseIsUp ? 200 : 503);
    }

    /**
     * Envía un "ping" a MongoDB. Si falla, el error se registra en el log,
     * pero nunca se muestra al cliente (podría revelar detalles internos).
     */
    private function databaseIsUp(): bool
    {
        try {
            DB::connection('mongodb')->getDatabase()->command(['ping' => 1]);

            return true;
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
