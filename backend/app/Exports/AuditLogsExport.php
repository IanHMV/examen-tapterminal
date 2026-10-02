<?php

namespace App\Exports;

use App\Enums\AuditAction;
use App\Enums\Section;
use App\Models\AuditLog;
use MongoDB\Laravel\Eloquent\Builder;

/**
 * Bitácora con los mismos filtros de la pantalla. La columna "Cambios" resume el
 * dato anterior y el actual de cada campo ("Precio: 289.00 → 310.00").
 */
class AuditLogsExport implements TableExport
{
    private const ENTITY_LABELS = ['products' => 'Producto', 'profiles' => 'Perfil', 'users' => 'Usuario'];

    /** Nombre de cada campo, como en la pantalla de Angular. */
    private const FIELD_LABELS = [
        'name' => 'Nombre',
        'brand' => 'Marca',
        'price' => 'Precio',
        'sections' => 'Secciones',
        'email' => 'Correo',
        'phone' => 'Teléfono',
        'profile_codes' => 'Perfiles',
        'photo_id' => 'Foto',
        'password' => 'Contraseña',
    ];

    /** @param  Builder<AuditLog>  $query  Consulta ya filtrada y ordenada. */
    public function __construct(private readonly Builder $query)
    {
    }

    public function title(): string
    {
        return 'Bitácora';
    }

    public function headings(): array
    {
        return ['Fecha', 'Entidad', 'Código', 'Acción', 'Usuario', 'Cambios'];
    }

    public function rows(): iterable
    {
        foreach ($this->query->cursor() as $log) {
            yield [
                $log->created_at,
                self::ENTITY_LABELS[$log->entity] ?? $log->entity,
                $log->entity_code,
                $log->action->label(),
                $log->user ? "{$log->user['name']} ({$log->user['code']})" : 'Sistema',
                $this->describeChanges($log),
            ];
        }
    }

    /** "Precio: 289.00 → 310.00; Contraseña: cambió". En un alta o una eliminación, solo un valor. */
    private function describeChanges(AuditLog $log): string
    {
        $before = $log->before ?? [];
        $after = $log->after ?? [];
        $parts = [];

        foreach ($log->changed_fields ?? [] as $field) {
            $label = self::FIELD_LABELS[$field] ?? $field;

            // Campo oculto (la contraseña): la bitácora no tiene su valor.
            if (! array_key_exists($field, $before) && ! array_key_exists($field, $after)) {
                $parts[] = "{$label}: cambió";
                continue;
            }

            $parts[] = $label . ': ' . match ($log->action) {
                AuditAction::Created => $this->formatValue($field, $after),
                AuditAction::Deleted => $this->formatValue($field, $before),
                AuditAction::Updated => $this->formatValue($field, $before) . ' → ' . $this->formatValue($field, $after),
            };
        }

        return implode('; ', $parts);
    }

    /** @param  array<string, mixed>  $values */
    private function formatValue(string $field, array $values): string
    {
        $value = $values[$field] ?? null;

        if (is_array($value)) {
            $items = $field === 'sections'
                ? array_map(fn (string $key) => Section::tryFrom($key)?->label() ?? $key, $value)
                : $value;

            return $items === [] ? '(ninguno)' : implode(', ', $items);
        }

        return $value === null || $value === '' ? '(vacío)' : (string) $value;
    }
}
