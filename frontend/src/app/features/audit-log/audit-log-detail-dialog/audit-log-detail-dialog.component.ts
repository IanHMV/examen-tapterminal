import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, ElementRef, computed, input, viewChild } from '@angular/core';

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_FIELD_LABELS,
  AUDIT_HIDDEN_FIELDS,
} from '../../../core/constants/audit-log';
import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { SECTION_LINKS } from '../../../core/constants/sections';
import { AuditLog, AuditValues } from '../../../core/models/audit-log.model';

/** Una fila de la comparación: el campo, su valor antes y después, y si cambió. */
interface ComparisonRow {
  field: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

/** Texto de un valor guardado en la bitácora. */
function formatValue(field: string, values: AuditValues | null): string {
  // Sin datos de ese lado: el registro no existía (alta) o ya no existe (eliminación).
  if (values === null) {
    return '—';
  }

  if (AUDIT_HIDDEN_FIELDS.includes(field)) {
    return '(oculta)';
  }

  const value = values[field];

  if (Array.isArray(value)) {
    const items = field === 'sections' ? value.map(sectionLabel) : value.map(String);
    return items.length > 0 ? items.join(', ') : '(ninguno)';
  }

  return value === null || value === undefined || value === '' ? '(vacío)' : String(value);
}

/** "products" → "Productos". */
function sectionLabel(key: unknown): string {
  return SECTION_LINKS.find((link) => link.key === key)?.label ?? String(key);
}

/**
 * Detalle de un registro de la bitácora en una ventana modal: compara campo por
 * campo el dato anterior con el actual (requisito del examen) y resalta lo que cambió.
 */
@Component({
  selector: 'app-audit-log-detail-dialog',
  imports: [DatePipe, LowerCasePipe],
  templateUrl: './audit-log-detail-dialog.component.html',
  styleUrl: './audit-log-detail-dialog.component.scss',
})
export class AuditLogDetailDialogComponent {
  /** Registro a mostrar; ya trae el antes y el después, no hace falta otra petición. */
  readonly log = input<AuditLog | null>(null);

  protected readonly entityLabels = AUDIT_ENTITY_LABELS;
  protected readonly actionLabels = AUDIT_ACTION_LABELS;
  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly rows = computed<ComparisonRow[]>(() => {
    const log = this.log();

    if (!log) {
      return [];
    }

    // Todos los campos de los dos lados, más los ocultos que cambiaron (la contraseña).
    const fields = new Set([...Object.keys(log.before ?? {}), ...Object.keys(log.after ?? {}), ...log.changed_fields]);

    return [...fields].map((field) => ({
      field,
      label: AUDIT_FIELD_LABELS[field] ?? field,
      before: formatValue(field, log.before),
      after: formatValue(field, log.after),
      changed: log.changed_fields.includes(field),
    }));
  });

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
