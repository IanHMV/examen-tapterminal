<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

/**
 * Valida los datos de un usuario al editarlo (PUT, JSON). La foto se cambia
 * aparte (POST /users/{code}/photo) porque PHP no lee archivos enviados con PUT.
 *
 * StoreUserRequest extiende esta clase y solo agrega la foto obligatoria.
 */
#[OA\Schema(
    schema: 'UserInput',
    required: ['name', 'email', 'profile_codes'],
    properties: [
        new OA\Property(property: 'name', type: 'string', maxLength: 100, example: 'Ana López', description: 'Nombre completo.'),
        new OA\Property(
            property: 'email',
            type: 'string',
            format: 'email',
            example: 'ana.lopez@tapterminal.com',
            description: 'Usuario para iniciar sesión. Único; se guarda en minúsculas.'
        ),
        new OA\Property(
            property: 'phone',
            type: 'string',
            nullable: true,
            example: '+52 314 123 4567',
            description: 'Opcional. Con lada del país; se guarda sin espacios (+523141234567).'
        ),
        new OA\Property(
            property: 'profile_codes',
            type: 'array',
            minItems: 1,
            items: new OA\Items(type: 'string'),
            example: ['PRF-0002']
        ),
    ],
    type: 'object'
)]
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Los permisos por perfil se aplican en el TICK-20.
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            // Al editar, ignora al propio usuario (route('user') es null al crear).
            'email' => ['required', 'string', 'max:255', 'email:filter', Rule::unique('users', 'email')->ignore($this->route('user'))],
            // E.164: "+", lada del país y número; de 8 a 15 dígitos en total.
            'phone' => ['nullable', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
            'profile_codes' => ['required', 'array', 'min:1'],
            'profile_codes.*' => ['required', 'string', 'distinct', 'exists:profiles,code'],
        ];
    }

    /** Normaliza antes de validar, para guardar siempre el mismo formato. */
    protected function prepareForValidation(): void
    {
        $this->merge(array_filter([
            // "Ana@X.com" y "ana@x.com" son el mismo usuario.
            'email' => is_string($this->email) ? Str::lower($this->email) : null,
            // "+52 (314) 123-4567" → "+523141234567".
            'phone' => is_string($this->phone) ? preg_replace('/[\s().-]/', '', $this->phone) : null,
            // Los códigos de perfil se guardan en mayúsculas: "prf-0001" → "PRF-0001".
            'profile_codes' => is_array($this->profile_codes)
                ? array_map(fn ($code) => is_string($code) ? Str::upper($code) : $code, $this->profile_codes)
                : null,
        ], fn ($value) => $value !== null));
    }
}
