<?php

namespace App\Models\Concerns;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;

/**
 * Guarda en la bitácora cada alta, edición y eliminación del modelo, con el dato
 * anterior y el actual para poder compararlos.
 *
 * El modelo indica qué campos se registran con auditedAttributes(). De los campos
 * ocultos ($hidden, como la contraseña) nunca se guarda el valor: solo que cambiaron.
 * Requiere el campo "code" (HasSequentialCode).
 *
 * Se registran los cambios hechos con el modelo (save, update, delete), que son los
 * que usa la API. Una consulta masiva (Model::where(...)->update()) no dispara eventos.
 *
 * @mixin \Illuminate\Database\Eloquent\Model
 */
trait Auditable
{
    /**
     * Campos que se guardan en la bitácora.
     *
     * @return list<string>
     */
    abstract protected function auditedAttributes(): array;

    public static function bootAuditable(): void
    {
        static::created(fn (self $model) => $model->recordAudit(AuditAction::Created));
        static::updated(fn (self $model) => $model->recordAudit(AuditAction::Updated));
        static::deleted(fn (self $model) => $model->recordAudit(AuditAction::Deleted));
    }

    private function recordAudit(AuditAction $action): void
    {
        $visible = array_values(array_diff($this->auditedAttributes(), $this->getHidden()));

        // En el evento "updated" Laravel todavía conserva el valor anterior en getOriginal().
        $before = $action === AuditAction::Created ? null : $this->auditValues($visible, original: true);
        $after = $action === AuditAction::Deleted ? null : $this->auditValues($visible, original: false);

        $changes = array_filter($visible, fn (string $field) => ($before[$field] ?? null) !== ($after[$field] ?? null));

        if ($action === AuditAction::Updated) {
            // De los campos ocultos solo se anota que cambiaron, sin su valor.
            $hidden = array_intersect($this->auditedAttributes(), $this->getHidden());
            $changes = [...$changes, ...array_intersect($hidden, array_keys($this->getChanges()))];

            // Una edición que no tocó ningún campo auditado no se registra.
            if ($changes === []) {
                return;
            }
        }

        $user = auth()->user();

        AuditLog::create([
            'entity' => $this->getTable(),
            'entity_code' => $this->code,
            'action' => $action,
            'before' => $before,
            'after' => $after,
            'changed_fields' => array_values($changes),
            // Copia del código y el nombre: el registro conserva quién fue aunque ese usuario cambie o se borre.
            'user' => $user instanceof User ? ['code' => $user->code, 'name' => $user->name] : null,
            'ip' => app()->runningInConsole() ? null : request()->ip(),
        ]);
    }

    /**
     * @param  list<string>  $fields
     * @return array<string, mixed>
     */
    private function auditValues(array $fields, bool $original): array
    {
        $values = [];

        foreach ($fields as $field) {
            // Con los casts del modelo: el precio queda como texto ("289.00"), no como Decimal128.
            $values[$field] = $original ? $this->getOriginal($field) : $this->getAttribute($field);
        }

        return $values;
    }
}
