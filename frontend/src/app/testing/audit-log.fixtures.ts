import { AuditLog } from '../core/models/audit-log.model';

/**
 * Datos de prueba de la bitácora: por defecto, la edición del precio de un producto.
 * Solo los importan los archivos .spec.ts: no forman parte de la app.
 */
export function buildAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: '6ac01b31bb27fcfdba0e0c01',
    entity: 'products',
    entity_code: 'PRD-0001',
    action: 'updated',
    before: { name: 'Casco de seguridad tipo I', brand: '3M', price: '289.00' },
    after: { name: 'Casco de seguridad tipo I', brand: '3M', price: '310.00' },
    changed_fields: ['price'],
    user: { code: 'USR-0001', name: 'Administrador' },
    ip: '203.0.113.7',
    created_at: '2026-10-02T18:30:00+00:00',
    ...overrides,
  };
}
