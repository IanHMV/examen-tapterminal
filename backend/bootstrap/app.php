<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use MongoDB\Driver\Exception\BulkWriteException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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

        // 404: el mensaje de Laravel revela nombres internos
        // ("No query results for model [App\Models\Product]").
        $exceptions->render(function (NotFoundHttpException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Recurso no encontrado.'], 404);
            }
        });

        // Un índice único de MongoDB rechazó el dato (11000 = clave duplicada). La validación
        // ya lo evita; esto cubre dos peticiones simultáneas con el mismo dato: 409, no 500.
        $exceptions->render(function (BulkWriteException $exception, Request $request) {
            if ($request->is('api/*') && $exception->getCode() === 11000) {
                return response()->json(['message' => 'El registro ya existe.'], 409);
            }
        });
    })->create();
