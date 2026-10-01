/** Respuesta de GET /api/v1/healthcheck (documentada en Swagger). */
export interface Healthcheck {
  status: 'ok' | 'degraded';
  service: string;
  checks: {
    database: 'ok' | 'error';
  };
  /** Fecha ISO 8601 en UTC; se muestra en hora local con DATE_TIME_FORMAT. */
  timestamp: string;
}
