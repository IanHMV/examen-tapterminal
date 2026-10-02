<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

/**
 * Formato JSON público de un registro de la bitácora.
 *
 * @mixin \App\Models\AuditLog
 */
#[OA\Schema(
    schema: 'AuditLog',
    required: ['id', 'entity', 'entity_code', 'action', 'before', 'after', 'changed_fields', 'user', 'ip', 'created_at'],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            example: '66fd1a2b9c1d4b0012a3b4d0',
            description: 'Identificador de MongoDB (ObjectId).'
        ),
        new OA\Property(property: 'entity', type: 'string', enum: ['products', 'profiles', 'users'], example: 'products'),
        new OA\Property(property: 'entity_code', type: 'string', example: 'PRD-0001'),
        new OA\Property(property: 'action', ref: '#/components/schemas/AuditAction'),
        new OA\Property(
            property: 'before',
            type: 'object',
            nullable: true,
            description: 'Datos antes del cambio (null en un alta).',
            example: ['name' => 'Casco de seguridad tipo I', 'brand' => '3M', 'price' => '289.00']
        ),
        new OA\Property(
            property: 'after',
            type: 'object',
            nullable: true,
            description: 'Datos después del cambio (null en una eliminación).',
            example: ['name' => 'Casco de seguridad tipo I', 'brand' => '3M', 'price' => '310.00']
        ),
        new OA\Property(
            property: 'changed_fields',
            type: 'array',
            items: new OA\Items(type: 'string'),
            example: ['price'],
            description: 'Campos que cambiaron. La contraseña puede aparecer aquí, pero su valor nunca se guarda.'
        ),
        new OA\Property(
            property: 'user',
            type: 'object',
            nullable: true,
            description: 'Quién hizo el cambio, copiado al momento del cambio (null = el sistema, por ejemplo los datos iniciales).',
            properties: [
                new OA\Property(property: 'code', type: 'string', example: 'USR-0001'),
                new OA\Property(property: 'name', type: 'string', example: 'Administrador'),
            ]
        ),
        new OA\Property(property: 'ip', type: 'string', nullable: true, example: '203.0.113.7'),
        new OA\Property(
            property: 'created_at',
            type: 'string',
            format: 'date-time',
            example: '2026-10-02T18:30:00+00:00'
        ),
    ],
    type: 'object'
)]
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'entity' => $this->entity,
            'entity_code' => $this->entity_code,
            'action' => $this->action->value,
            'before' => $this->before,
            'after' => $this->after,
            'changed_fields' => $this->changed_fields ?? [],
            'user' => $this->user,
            'ip' => $this->ip,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
