<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;

/*
|--------------------------------------------------------------------------
| Laravel Sanctum
|--------------------------------------------------------------------------
| La API usa solo tokens "Bearer" (encabezado Authorization). No usa sesiones
| con cookies: la API no guarda estado (SESSION_DRIVER=array) y así el token
| también se puede usar desde Swagger o Postman.
*/

return [

    // Sin dominios "stateful": ningún origen se autentica con cookies de sesión.
    'stateful' => [],

    // Sin guard de sesión: Sanctum solo revisa el token Bearer.
    'guard' => [],

    // Minutos que dura un token (8 h = una jornada). Después, hay que iniciar sesión de nuevo.
    // MongoDB borra los tokens vencidos con un índice TTL (ver la migración).
    'expiration' => (int) env('SANCTUM_EXPIRATION', 480),

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];
