<?php

use App\Http\Controllers\Api\V1\HealthcheckController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SectionController;
use App\Http\Controllers\Api\V1\UserController;
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

    Route::apiResource('products', ProductController::class);

    Route::get('/sections', SectionController::class)->name('sections.index');
    // Antes de apiResource: si no, "options" se tomaría como el código de un perfil.
    Route::get('/profiles/options', [ProfileController::class, 'options'])->name('profiles.options');
    Route::apiResource('profiles', ProfileController::class);

    Route::apiResource('users', UserController::class);
    Route::get('/users/{user}/photo', [UserController::class, 'photo'])->name('users.photo.show');
    Route::post('/users/{user}/photo', [UserController::class, 'updatePhoto'])->name('users.photo.update');
});
