<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Swagger solo se puede consultar con la contraseña de SWAGGER_PASSWORD (.env),
 * enviada con HTTP Basic: el navegador la pide en una ventana (cualquier usuario).
 */
class ProtectApiDocs
{
    public function handle(Request $request, Closure $next): Response
    {
        $password = (string) config('l5-swagger.defaults.password');

        // Sin contraseña configurada nadie entra; hash_equals compara sin revelar nada por el tiempo.
        if ($password !== '' && hash_equals($password, (string) $request->getPassword())) {
            return $next($request);
        }

        return response('Se requiere contraseña para ver la documentación.', Response::HTTP_UNAUTHORIZED, [
            'WWW-Authenticate' => 'Basic realm="Documentacion de la API", charset="UTF-8"',
        ]);
    }
}
