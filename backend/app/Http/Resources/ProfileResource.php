<?php

namespace App\Http\Resources;

use App\Enums\Section;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

/**
 * Formato JSON público de un perfil.
 *
 * Las secciones salen con clave y nombre, listas para mostrarse
 * en el detalle (modal) sin otra petición.
 *
 * @mixin \App\Models\Profile
 */
#[OA\Schema(
    schema: 'Profile',
    required: ['id', 'code', 'name', 'sections', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            example: '66fb6a1e9c1d4b0012a3b4c6',
            description: 'Identificador de MongoDB (ObjectId).'
        ),
        new OA\Property(
            property: 'code',
            type: 'string',
            example: 'PRF-0001',
            description: 'Código autogenerado; no se puede modificar.'
        ),
        new OA\Property(property: 'name', type: 'string', example: 'Administrador'),
        new OA\Property(
            property: 'sections',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/Section')
        ),
        new OA\Property(
            property: 'created_at',
            type: 'string',
            format: 'date-time',
            example: '2026-10-01T18:30:00+00:00'
        ),
        new OA\Property(
            property: 'updated_at',
            type: 'string',
            format: 'date-time',
            example: '2026-10-01T18:30:00+00:00'
        ),
    ],
    type: 'object'
)]
class ProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'sections' => array_map(fn (Section $section) => $section->toArray(), $this->sectionList()),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
