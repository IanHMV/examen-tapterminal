<?php

namespace App\Http\Requests;

/**
 * Valida la edición de un perfil (PUT).
 *
 * Usa las mismas reglas que el alta porque PUT reemplaza nombre y secciones.
 * La regla "unique" del nombre ya ignora al perfil que se está editando.
 */
class UpdateProfileRequest extends StoreProfileRequest
{
}
