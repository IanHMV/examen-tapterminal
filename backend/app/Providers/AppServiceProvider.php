<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Sanctum guarda sus tokens en MongoDB con este modelo.
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Inicio de sesión: máximo 5 intentos por minuto para cada correo desde cada IP.
        // Frena a quien intenta adivinar contraseñas sin bloquear a los demás usuarios.
        // El correo llega en el encabezado Authorization: Basic (getUser()).
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(Str::lower((string) $request->getUser()) . '|' . $request->ip());
        });

        // Recuperación de contraseña: máximo 5 solicitudes por minuto desde cada IP, cambie o no
        // el correo, para que nadie use la API para mandar correos en masa. Además, el broker
        // genera como máximo un enlace por minuto para cada correo ("throttle" en config/auth.php).
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
