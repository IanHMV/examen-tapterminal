<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rules\Password;
use OpenApi\Attributes as OA;

/**
 * Valida el enlace y la contraseña nueva.
 */
#[OA\Schema(
    schema: 'ResetPasswordInput',
    required: ['token', 'email', 'password', 'password_confirmation'],
    properties: [
        new OA\Property(
            property: 'token',
            type: 'string',
            example: '3f9a…',
            description: 'Token del enlace que llegó por correo (lo que va después de "#").'
        ),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'ana.lopez@tapterminal.com'),
        new OA\Property(
            property: 'password',
            type: 'string',
            format: 'password',
            example: 'Puerto-2026',
            description: 'De 8 a 72 caracteres, con al menos una letra y un número.'
        ),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'Puerto-2026'),
    ],
    type: 'object'
)]
class ResetPasswordRequest extends ForgotPasswordRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'token' => ['required', 'string', 'max:255'],
            // Máximo 72: bcrypt ignora lo que pase de 72 bytes.
            'password' => ['required', 'string', 'confirmed', Password::min(8)->max(72)->letters()->numbers()],
        ];
    }
}
