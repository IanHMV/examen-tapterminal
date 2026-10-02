<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

/**
 * Valida el correo para pedir un enlace de recuperación de contraseña.
 */
#[OA\Schema(
    schema: 'ForgotPasswordInput',
    required: ['email'],
    properties: [
        new OA\Property(
            property: 'email',
            type: 'string',
            format: 'email',
            example: 'ana.lopez@tapterminal.com',
            description: 'Correo con el que inicia sesión. No distingue mayúsculas.'
        ),
    ],
    type: 'object'
)]
class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Los correos se guardan en minúsculas. */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'max:255', 'email:filter'],
        ];
    }
}
