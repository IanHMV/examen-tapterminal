<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Reporta si la API está en funcionamiento.
 *
 * Lo consumen el frontend (TICK-06) y el monitoreo de Docker (TICK-09).
 * No expone versiones de software para no facilitar el reconocimiento a un atacante.
 */
class HealthcheckController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => config('app.name'),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
