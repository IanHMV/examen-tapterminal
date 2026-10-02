<?php

namespace App\Http\Middleware;

use App\Enums\Section;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deja pasar solo a usuarios con acceso a la sección (requisito del examen:
 * "los usuarios solo podrán ingresar a las secciones asignadas en sus perfiles").
 *
 * Uso en las rutas: ->middleware('section:products'). Con varias secciones
 * ('section:users,profiles') basta con tener una de ellas.
 */
class EnsureUserHasSection
{
    public function handle(Request $request, Closure $next, string ...$sections): Response
    {
        $user = $request->user();

        foreach ($sections as $section) {
            if ($user?->hasSection(Section::from($section))) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'No tienes acceso a esta sección.'], Response::HTTP_FORBIDDEN);
    }
}
