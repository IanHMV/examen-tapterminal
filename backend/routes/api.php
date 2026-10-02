<?php

use App\Http\Controllers\Api\V1\HealthcheckController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas de la API
|--------------------------------------------------------------------------
| Laravel agrega automáticamente el prefijo /api (ver bootstrap/app.php).
| Todas las rutas se versionan bajo /v1 para poder evolucionar la API
| sin romper a los clientes existentes.
*/

Route::prefix('v1')->name('v1.')->group(function () {
    Route::get('/healthcheck', HealthcheckController::class)->name('healthcheck');

    Route::apiResource('products', ProductController::class)->only(['index', 'store', 'show']);
});
