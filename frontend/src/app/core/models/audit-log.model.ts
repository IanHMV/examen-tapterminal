/** Entidades que registran sus cambios en la bitácora. */
export type AuditEntity = 'products' | 'profiles' | 'users';

/** Tipo de cambio: alta, edición o eliminación. */
export type AuditAction = 'created' | 'updated' | 'deleted';

/** Datos de un registro en un momento: campo → valor (texto, lista o null). */
export type AuditValues = Record<string, unknown>;

/** Registro de la bitácora tal como lo entrega la API (esquema AuditLog en Swagger). */
export interface AuditLog {
  id: string;
  entity: AuditEntity;
  entity_code: string;
  action: AuditAction;
  /** Datos antes del cambio (null en un alta). */
  before: AuditValues | null;
  /** Datos después del cambio (null en una eliminación). */
  after: AuditValues | null;
  /** Campos que cambiaron; la contraseña aparece aquí, pero sin su valor. */
  changed_fields: string[];
  /** Quién hizo el cambio (null = el sistema, por ejemplo los datos iniciales). */
  user: { code: string; name: string } | null;
  ip: string | null;
  /** Fecha ISO 8601 en UTC; se muestra en hora local con DATE_TIME_FORMAT. */
  created_at: string;
}

/** Filtros del listado; null = sin filtro. */
export interface AuditLogFilters {
  entity: AuditEntity | null;
  code: string | null;
}
