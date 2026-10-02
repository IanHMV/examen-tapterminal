<?php

namespace App\Http\Requests;

/**
 * Valida la edición de un producto (PUT).
 *
 * Usa las mismas reglas que el alta porque PUT reemplaza los 3 campos.
 * El código no se puede editar
 */
class UpdateProductRequest extends StoreProductRequest
{
}
