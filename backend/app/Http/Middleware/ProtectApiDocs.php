<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pide contraseña (HTTP Basic) para ver Swagger. La contraseña viene de SWAGGER_PASSWORD
 * en el .env; si está vacía (desarrollo), la documentación queda abierta.
 */
class ProtectApiDocs
{
    public function handle(Request $request, Closure $next): Response
    {
        $password = (string) config('l5-swagger.defaults.password');

        if ($password === '' || hash_equals($password, (string) $request->getPassword())) {
            return $next($request);
        }

        return response('Se requiere contraseña para ver la documentación.', Response::HTTP_UNAUTHORIZED, [
            'WWW-Authenticate' => 'Basic realm="Documentacion de la API", charset="UTF-8"',
        ]);
    }
}
