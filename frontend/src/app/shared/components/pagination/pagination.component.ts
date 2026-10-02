import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Paginated } from '../../../core/models/api.model';

/**
 * Navegación entre páginas de un listado. Cambia ?pagina= en la URL de la
 * pantalla actual (y conserva los demás parámetros, como los filtros); la
 * pantalla escucha la URL y pide la página a la API.
 */
@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  /** Datos de paginación que devuelve la API (links y meta). */
  readonly page = input.required<Pick<Paginated<unknown>, 'links' | 'meta'>>();

  /** Qué se está listando, en plural: "productos", "perfiles". */
  readonly itemsLabel = input.required<string>();
}
