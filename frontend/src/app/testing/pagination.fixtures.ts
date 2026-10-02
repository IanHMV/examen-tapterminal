import { Paginated } from '../core/models/api.model';

/**
 * Página de un listado con valores por defecto coherentes (una sola página).
 * Solo la importan los archivos .spec.ts: no forma parte de la app.
 */
export function buildPage<T>(
  items: T[],
  meta: Partial<Paginated<T>['meta']> = {},
  links: Partial<Paginated<T>['links']> = {},
): Paginated<T> {
  return {
    data: items,
    links: { first: null, last: null, prev: null, next: null, ...links },
    meta: {
      current_page: 1,
      last_page: 1,
      from: items.length > 0 ? 1 : null,
      to: items.length > 0 ? items.length : null,
      total: items.length,
      ...meta,
    },
  };
}
