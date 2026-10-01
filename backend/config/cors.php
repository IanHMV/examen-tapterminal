<?php

/*
|--------------------------------------------------------------------------
| CORS (Cross-Origin Resource Sharing)
|--------------------------------------------------------------------------
| Define qué origenes (otros sitios web) pueden leer las respuestas de la
| API desde un navegador. Solo se permite el frontend de Angular.
|
*/

return [

    // Solo aplica a las rutas de la API.
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    // Orígenes permitidos, separados por coma (CORS_ALLOWED_ORIGINS en .env).
    // Si la variable no existe, no se permite ningún origen externo.
    'allowed_origins' => array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 0,

    // La API usa tokens en la cabecera Authorization, no cookies.
    'supports_credentials' => false,

];
