/** Respuesta de GET /api/v1/healthcheck. */
export interface Healthcheck {
  status: string;
  service: string;
  /** Fecha ISO 8601 en UTC.*/
  timestamp: string;
}
