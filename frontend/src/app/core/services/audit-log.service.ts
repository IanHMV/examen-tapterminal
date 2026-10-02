import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginated } from '../models/api.model';
import { AuditLog, AuditLogFilters } from '../models/audit-log.model';

/**
 * Consulta de la bitácora en la API (solo lectura).
 */
@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit-logs`;

  /** Una página de la bitácora; los filtros vacíos no se envían. */
  list(page: number, filters: AuditLogFilters): Observable<Paginated<AuditLog>> {
    let params = new HttpParams().set('page', page);

    if (filters.entity) {
      params = params.set('entity', filters.entity);
    }

    if (filters.code) {
      params = params.set('code', filters.code);
    }

    return this.http.get<Paginated<AuditLog>>(this.baseUrl, { params });
  }
}
