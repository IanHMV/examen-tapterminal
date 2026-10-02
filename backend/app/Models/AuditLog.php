<?php

namespace App\Models;

use App\Enums\AuditAction;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Registro de la bitácora (colección "audit_logs"): quién cambió qué y cuándo,
 * con el dato anterior y el actual para poder compararlos (requisito del examen).
 *
 * Es de solo lectura: un registro no se puede editar ni borrar.
 *
 * @property string $entity                     Colección del registro: products, profiles o users.
 * @property string $entity_code                Código del registro (PRD-0001).
 * @property AuditAction $action
 * @property array<string, mixed>|null $before  Datos antes del cambio (null en un alta).
 * @property array<string, mixed>|null $after   Datos después del cambio (null en una eliminación).
 * @property list<string> $changed_fields       Campos que cambiaron.
 * @property array{code: string, name: string}|null $user  Quién hizo el cambio (null = el sistema).
 * @property string|null $ip
 * @property \Illuminate\Support\Carbon $created_at
 */
class AuditLog extends Model
{
    /** Un registro nunca se modifica: solo tiene fecha de creación. */
    public const UPDATED_AT = null;

    /** Colecciones que registran sus cambios (modelos con el trait Auditable). */
    public const ENTITIES = ['products', 'profiles', 'users'];

    protected $table = 'audit_logs';

    protected $fillable = ['entity', 'entity_code', 'action', 'before', 'after', 'changed_fields', 'user', 'ip'];

    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
        ];
    }

    protected static function booted(): void
    {
        // Solo lectura: si un evento "...ing" devuelve false, Eloquent cancela la operación.
        static::updating(fn () => false);
        static::deleting(fn () => false);
    }
}
