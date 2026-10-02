<?php

namespace App\Enums;

use OpenApi\Attributes as OA;

/**
 * Tipo de cambio que guarda la bitácora.
 */
#[OA\Schema(
    schema: 'AuditAction',
    type: 'string',
    description: 'created = alta, updated = edición, deleted = eliminación.'
)]
enum AuditAction: string
{
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';

    /** Nombre que se muestra en las exportaciones. */
    public function label(): string
    {
        return match ($this) {
            self::Created => 'Alta',
            self::Updated => 'Edición',
            self::Deleted => 'Eliminación',
        };
    }
}
