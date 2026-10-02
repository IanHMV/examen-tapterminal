<?php

namespace App\Http\Requests;

use App\Enums\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

/**
 * Valida los datos para dar de alta un perfil.
 */
#[OA\Schema(
    schema: 'ProfileInput',
    required: ['name', 'sections'],
    properties: [
        new OA\Property(
            property: 'name',
            type: 'string',
            maxLength: 60,
            example: 'Capturista',
            description: 'Nombre único, sin distinguir mayúsculas.'
        ),
        new OA\Property(
            property: 'sections',
            type: 'array',
            minItems: 1,
            items: new OA\Items(ref: '#/components/schemas/SectionKey'),
            example: ['products']
        ),
    ],
    type: 'object'
)]
class StoreProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Los permisos por perfil
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // Al editar, ignora el propio perfil (route('profile') es null al crear).
            'name' => ['required', 'string', 'max:60', Rule::unique('profiles', 'name')->ignore($this->route('profile'))],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*' => ['required', 'string', 'distinct', Rule::enum(Section::class)],
        ];
    }
}
