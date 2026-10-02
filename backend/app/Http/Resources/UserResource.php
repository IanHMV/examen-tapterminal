<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;
use OpenApi\Attributes as OA;

/**
 * Formato JSON público de un usuario (listado).
 *
 * Nunca incluye la contraseña. La foto se entrega como URL firmada y temporal:
 * <img> no puede enviar el token, así que la firma demuestra que la URL la dio
 * la API a alguien con sesión. "?v=" cambia cuando cambia la foto.
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
            example: 'http://localhost:8000/api/v1/users/USR-0001/photo?expires=1790960399&v=66fb6a1e9c1d4b0012a3b4c8&signature=3f1c…',
            description: 'URL firmada que vence en 1 o 2 horas; se renueva en cada respuesta de la API.'
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
            'photo_url' => URL::temporarySignedRoute(
                'v1.users.photo.show',
                // Vence al cierre de la hora siguiente: durante esa hora la URL no cambia
                // y el navegador puede reutilizar la imagen que ya descargó.
                now()->addHour()->endOfHour(),
                ['user' => $this->code, 'v' => $this->photo_id],
            ),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
