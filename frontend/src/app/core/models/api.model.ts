/** Respuesta de un API Resource de Laravel: el contenido viaja dentro de "data". */
export interface ApiResource<T> {
  data: T;
}

/** Listado paginado de Laravel (esquemas PaginationLinks y PaginationMeta en Swagger). */
export interface Paginated<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  /** Solo los campos que usa la app. */
  meta: {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
  };
}

/** Respuesta 422 de Laravel (esquema ValidationError en Swagger). */
export interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}
