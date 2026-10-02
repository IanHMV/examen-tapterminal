/** Respuesta de un API Resource de Laravel: el contenido viaja dentro de "data". */
export interface ApiResource<T> {
  data: T;
}

/** Respuesta 422 de Laravel (esquema ValidationError en Swagger). */
export interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}
