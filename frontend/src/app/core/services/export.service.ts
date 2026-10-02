import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

export type ExportFormat = 'xlsx' | 'pdf';

/** Nombre del archivo que propone la API (Content-Disposition: attachment; filename=...). */
function filenameFrom(header: string | null): string | null {
  return /filename="?([^";]+)"?/.exec(header ?? '')?.[1] ?? null;
}

/**
 * Descarga los listados en Excel o PDF. Los genera la API con todos los registros,
 * no solo la página que se ve.
 *
 * Un enlace normal no puede enviar el token, así que el archivo se pide con
 * HttpClient (el interceptor agrega el token) y se guarda desde el navegador.
 */
@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  /**
   * @param resource Ruta de la API: "products", "audit-logs"...
   * @param filters  Filtros del listado (por ejemplo, los de la bitácora).
   */
  download(resource: string, format: ExportFormat, filters: Record<string, string> = {}): Observable<void> {
    const params = new HttpParams({
      fromObject: {
        ...filters,
        format,
        // La API muestra las fechas en esta zona horaria: salen igual que en pantalla.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });

    return this.http
      .get(`${environment.apiUrl}/${resource}/export`, { params, observe: 'response', responseType: 'blob' })
      .pipe(
        map((response) =>
          this.save(response.body as Blob, filenameFrom(response.headers.get('Content-Disposition')) ?? `${resource}.${format}`),
        ),
      );
  }

  /** Guarda el archivo con un enlace temporal (blob:), como si el usuario hiciera clic en "Descargar". */
  private save(file: Blob, filename: string): void {
    const url = URL.createObjectURL(file);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
