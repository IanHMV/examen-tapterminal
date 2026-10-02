import { AuditAction, AuditEntity } from '../models/audit-log.model';

/** Nombre de cada entidad en la interfaz. */
export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  products: 'Producto',
  profiles: 'Perfil',
  users: 'Usuario',
};

/** Nombre de cada tipo de cambio en la interfaz. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Alta',
  updated: 'Edición',
  deleted: 'Eliminación',
};

/** Nombre de cada campo que guarda la bitácora (auditedAttributes() de cada modelo en la API). */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  brand: 'Marca',
  price: 'Precio',
  sections: 'Secciones',
  email: 'Correo',
  phone: 'Teléfono',
  profile_codes: 'Perfiles',
  photo_id: 'Foto (id en GridFS)',
  password: 'Contraseña',
};

/** Campos cuyo valor nunca se guarda: la bitácora solo sabe que cambiaron. */
export const AUDIT_HIDDEN_FIELDS: readonly string[] = ['password'];
