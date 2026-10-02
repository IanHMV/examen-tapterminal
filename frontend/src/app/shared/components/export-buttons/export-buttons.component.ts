import { Component, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ExportFormat, ExportService } from '../../../core/services/export.service';

/**
 * Botones "Exportar a Excel" y "Exportar a PDF" de un listado (requisito del examen).
 */
@Component({
  selector: 'app-export-buttons',
  templateUrl: './export-buttons.component.html',
  styleUrl: './export-buttons.component.scss',
})
export class ExportButtonsComponent {
  private readonly exportService = inject(ExportService);

  /** Ruta de la API del listado: "products", "users", "profiles" o "audit-logs". */
  readonly resource = input.required<string>();

  /** Filtros aplicados en el listado; el archivo trae lo mismo que se ve filtrado. */
  readonly filters = input<Record<string, string>>({});

  /** Formato que se está generando (los botones se desactivan mientras tanto). */
  protected readonly downloading = signal<ExportFormat | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected download(format: ExportFormat): void {
    this.downloading.set(format);
    this.errorMessage.set(null);

    this.exportService
      .download(this.resource(), format, this.filters())
      .pipe(finalize(() => this.downloading.set(null)))
      .subscribe({
        error: () => this.errorMessage.set('No se pudo generar el archivo. Intenta de nuevo.'),
      });
  }
}
