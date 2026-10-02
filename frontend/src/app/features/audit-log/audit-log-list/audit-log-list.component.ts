import { DatePipe } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';

import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from '../../../core/constants/audit-log';
import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Paginated } from '../../../core/models/api.model';
import { AuditEntity, AuditLog } from '../../../core/models/audit-log.model';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { AuditLogDetailDialogComponent } from '../audit-log-detail-dialog/audit-log-detail-dialog.component';

type ListState = 'loading' | 'ready' | 'error';

const ENTITIES = Object.keys(AUDIT_ENTITY_LABELS) as AuditEntity[];

/** Solo acepta entidades conocidas: un ?entidad= inventado en la URL se ignora. */
function toEntity(value: string | null): AuditEntity | null {
  return ENTITIES.find((entity) => entity === value) ?? null;
}

/**
 * Bitácora del sistema: todos los cambios, del más reciente al más antiguo.
 * Los filtros y la página viajan en la URL (?entidad=products&codigo=PRD-0001&pagina=2).
 */
@Component({
  selector: 'app-audit-log-list',
  imports: [DatePipe, ReactiveFormsModule, PaginationComponent, AuditLogDetailDialogComponent],
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.scss',
})
export class AuditLogListComponent {
  private readonly auditLogService = inject(AuditLogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly detailDialog = viewChild.required(AuditLogDetailDialogComponent);

  protected readonly entityOptions = ENTITIES.map((key) => ({ key, label: AUDIT_ENTITY_LABELS[key] }));
  protected readonly entityLabels = AUDIT_ENTITY_LABELS;
  protected readonly actionLabels = AUDIT_ACTION_LABELS;
  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<ListState>('loading');
  protected readonly result = signal<Paginated<AuditLog> | null>(null);
  protected readonly selected = signal<AuditLog | null>(null);

  protected readonly filters = this.fb.group({
    entity: this.fb.control<AuditEntity | ''>(''),
    code: this.fb.control(''),
  });

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          page: Number(params.get('pagina')) || 1,
          entity: toEntity(params.get('entidad')),
          code: params.get('codigo')?.trim() || null,
        })),
        tap(({ entity, code }) => {
          // El formulario refleja la URL (también al usar Atrás y Adelante).
          this.filters.setValue({ entity: entity ?? '', code: code ?? '' });
          this.state.set('loading');
        }),
        // switchMap cancela la petición anterior si el usuario cambia de filtro o de página rápido.
        switchMap(({ page, entity, code }) =>
          this.auditLogService.list(page, { entity, code }).pipe(
            tap((result) => {
              this.result.set(result);
              this.state.set('ready');
            }),
            catchError(() => {
              this.state.set('error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /** Lleva los filtros a la URL y vuelve a la página 1; los filtros vacíos no aparecen. */
  protected search(): void {
    const { entity, code } = this.filters.getRawValue();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { entidad: entity || null, codigo: code.trim() || null },
    });
  }

  protected clear(): void {
    this.router.navigate([], { relativeTo: this.route });
  }

  protected showDetail(log: AuditLog): void {
    this.selected.set(log);
    this.detailDialog().open();
  }
}
