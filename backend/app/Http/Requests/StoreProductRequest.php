<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use OpenApi\Attributes as OA;

/**
 * Valida los datos para dar de alta un producto.
 *
 * Precio "máximo 3 dígitos": hasta 3 dígitos enteros y 2 decimales (0.01 a 999.99).
 */
#[OA\Schema(
    schema: 'ProductInput',
    required: ['name', 'brand', 'price'],
    properties: [
        new OA\Property(
            property: 'name',
            type: 'string',
            maxLength: 100,
            example: 'Casco de seguridad tipo I',
            description: 'Nombre del producto.'
        ),
        new OA\Property(property: 'brand', type: 'string', maxLength: 60, example: '3M'),
        new OA\Property(
            property: 'price',
            type: 'number',
            format: 'decimal',
            maximum: 999.99,
            minimum: 0.01,
            example: 289.5,
            description: 'Hasta 3 dígitos enteros y 2 decimales.'
        ),
    ],
    type: 'object'
)]
class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Los permisos por perfil se aplican en el TICK-20.
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'brand' => ['required', 'string', 'max:60'],
            'price' => ['bail', 'required', 'numeric', 'decimal:0,2', 'min:0.01', 'max:999.99'],
        ];
    }
}
