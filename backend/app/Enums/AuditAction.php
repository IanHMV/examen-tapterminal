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
}
