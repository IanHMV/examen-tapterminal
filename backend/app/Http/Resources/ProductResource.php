<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

/**
 * Formato JSON público de un producto.
 *
 * Define qué campos salen de la API y nunca se expone el documento
 * de MongoDB tal cual (por ejemplo, "_id").
 *
 * @mixin \App\Models\Product
 */
#[OA\Schema(
    schema: 'Product',
    required: ['id', 'code', 'name', 'brand', 'price', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            example: '66fb6a1e9c1d4b0012a3b4c5',
            description: 'Identificador de MongoDB (ObjectId).'
        ),
        new OA\Property(
            property: 'code',
            type: 'string',
            example: 'PRD-0011',
            description: 'Código autogenerado; no se puede modificar.'
        ),
        new OA\Property(property: 'name', type: 'string', example: 'Casco de seguridad tipo I'),
        new OA\Property(property: 'brand', type: 'string', example: '3M'),
        new OA\Property(
            property: 'price',
            type: 'string',
            example: '289.50',
            description: 'Texto con 2 decimales, para no perder precisión.'
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
class ProductResource extends JsonResource
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
            'brand' => $this->brand,
            'price' => $this->price,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
