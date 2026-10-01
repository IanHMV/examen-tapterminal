import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Healthcheck } from '../models/healthcheck.model';

/**
 * Consulta el estado de la API.
 */
@Injectable({
  providedIn: 'root',
})
export class HealthcheckService {
  private readonly http = inject(HttpClient);

  check(): Observable<Healthcheck> {
    return this.http.get<Healthcheck>(`${environment.apiUrl}/healthcheck`);
  }
}
