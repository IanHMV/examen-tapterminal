<?php

use App\Http\Controllers\Api\V1\AuthController;
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
    // ---------- Públicas ----------
    Route::get('/healthcheck', HealthcheckController::class)->name('healthcheck');

    // Máximo 5 intentos por minuto para cada correo (ver AppServiceProvider).
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('auth.login');

    // Recuperación de contraseña: máximo 5 solicitudes por minuto desde cada IP (ver AppServiceProvider).
    Route::middleware('throttle:password-reset')->group(function () {
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot-password');
        Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->name('auth.reset-password');
    });

    // <img> no envía el token: la foto se protege con una URL firmada y temporal ("signed").
    Route::get('/users/{user}/photo', [UserController::class, 'photo'])->middleware('signed')->name('users.photo.show');

    // ---------- Requieren sesión (Authorization: Bearer <token>) ----------
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        // Cada grupo exige su sección; sin ella, 403 (App\Http\Middleware\EnsureUserHasSection).
        Route::middleware('section:products')->group(function () {
            Route::apiResource('products', ProductController::class);
        });

        // El formulario de usuarios también necesita la lista de perfiles: basta con una de las dos.
        // Va antes de apiResource('profiles'): si no, "options" se tomaría como el código de un perfil.
        Route::get('/profiles/options', [ProfileController::class, 'options'])
            ->middleware('section:users,profiles')
            ->name('profiles.options');

        Route::middleware('section:profiles')->group(function () {
            Route::get('/sections', SectionController::class)->name('sections.index');
            Route::apiResource('profiles', ProfileController::class);
        });

        Route::middleware('section:users')->group(function () {
            Route::apiResource('users', UserController::class);
            Route::post('/users/{user}/photo', [UserController::class, 'updatePhoto'])->name('users.photo.update');
        });
    });
});
