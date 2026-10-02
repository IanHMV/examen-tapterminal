<?php

namespace App\Http\Resources;

use App\Enums\Section;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

/**
 * Usuario con sesión iniciada: sus datos, sus perfiles y las secciones a las
 * que tiene acceso (la suma de las secciones de todos sus perfiles). Angular
 * usa las secciones para mostrar solo las opciones permitidas del menú.
 *
 * @mixin \App\Models\User
 */
#[OA\Schema(
    schema: 'AuthUser',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/UserDetail'),
        new OA\Schema(
            required: ['sections'],
            properties: [
                new OA\Property(
                    property: 'sections',
                    type: 'array',
                    description: 'Secciones permitidas, sin repetir y en el orden del catálogo.',
                    items: new OA\Items(ref: '#/components/schemas/Section')
                ),
            ]
        ),
    ]
)]
class AuthUserResource extends UserDetailResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'sections' => array_map(fn (Section $section) => $section->toArray(), $this->accessibleSections()),
        ];
    }
}
