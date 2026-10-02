<?php

namespace App\Http\Resources;

use App\Models\Profile;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

/**
 * Usuario con sus perfiles (detalle). El listado usa UserResource sin perfiles
 * para no hacer una consulta extra por cada fila.
 *
 * @mixin \App\Models\User
 */
#[OA\Schema(
    schema: 'UserDetail',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/User'),
        new OA\Schema(
            required: ['profiles'],
            properties: [
                new OA\Property(
                    property: 'profiles',
                    type: 'array',
                    description: 'Perfiles asignados, ordenados por nombre.',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'code', type: 'string', example: 'PRF-0002'),
                            new OA\Property(property: 'name', type: 'string', example: 'Capturista de productos'),
                        ],
                        type: 'object'
                    )
                ),
            ]
        ),
    ]
)]
class UserDetailResource extends UserResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'profiles' => $this->assignedProfiles()
                ->map(fn (Profile $profile) => ['code' => $profile->code, 'name' => $profile->name])
                ->values(),
        ];
    }
}
