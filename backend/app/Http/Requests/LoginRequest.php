<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use OpenApi\Attributes as OA;

/**
 * Valida los datos para iniciar sesión.
 */
#[OA\Schema(
    schema: 'LoginInput',
    required: ['email', 'password'],
    properties: [
        new OA\Property(
            property: 'email',
            type: 'string',
            format: 'email',
            example: 'admin@example.com',
            description: 'Usuario (correo). No distingue mayúsculas.'
        ),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: '********'),
    ],
    type: 'object'
)]
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'max:255', 'email:filter'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }
}
