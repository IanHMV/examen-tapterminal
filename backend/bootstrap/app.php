<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Laravel corre detrás de proxies (Nginx del host y Nginx del contenedor).
        // Confiar en sus cabeceras X-Forwarded-* para conocer el protocolo real (https)
        // y la IP del visitante. Solo se confía en redes privadas (Docker y el propio
        // servidor): nadie puede hacerse pasar por un proxy.
        $middleware->trustProxies(at: ['PRIVATE_SUBNETS']);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Una API nunca responde HTML: los errores bajo /api/* siempre se devuelven en JSON.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
