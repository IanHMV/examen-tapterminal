<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

/**
 * Formato JSON público de un usuario (listado).
 *
 * Nunca incluye la contraseña. La foto se entrega como URL: el navegador la
 * pide aparte y "?v=" cambia cuando cambia la foto, así nunca muestra una vieja.
 *
 * @mixin \App\Models\User
 */
#[OA\Schema(
    schema: 'User',
    required: ['id', 'code', 'name', 'email', 'phone', 'photo_url', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            example: '66fb6a1e9c1d4b0012a3b4c7',
            description: 'Identificador de MongoDB (ObjectId).'
        ),
        new OA\Property(property: 'code', type: 'string', example: 'USR-0001', description: 'Código autogenerado.'),
        new OA\Property(property: 'name', type: 'string', example: 'Ana López'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'ana.lopez@tapterminal.com'),
        new OA\Property(property: 'phone', type: 'string', nullable: true, example: '+523141234567'),
        new OA\Property(
            property: 'photo_url',
            type: 'string',
            format: 'uri',
            example: 'http://localhost:8000/api/v1/users/USR-0001/photo?v=66fb6a1e9c1d4b0012a3b4c8'
        ),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-10-01T18:30:00+00:00'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-10-01T18:30:00+00:00'),
    ],
    type: 'object'
)]
class UserResource extends JsonResource
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
            'email' => $this->email,
            'phone' => $this->phone,
            'photo_url' => route('v1.users.photo.show', ['user' => $this->code, 'v' => $this->photo_id]),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
