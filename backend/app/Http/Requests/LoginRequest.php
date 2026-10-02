<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Valida las credenciales del inicio de sesión. Llegan en el encabezado
 * Authorization: Basic base64(correo:contraseña), nunca en el cuerpo de la petición.
 */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Valida el correo y la contraseña del encabezado; los campos del cuerpo se ignoran.
     *
     * @return array<string, string|null>
     */
    public function validationData(): array
    {
        return ['email' => $this->getUser(), 'password' => $this->getPassword()];
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
