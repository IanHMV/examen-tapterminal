import { Profile, Section } from '../core/models/profile.model';

/**
 * Datos de prueba de perfiles y secciones.
 * Solo los importan los archivos .spec.ts: no forman parte de la app.
 */
export const SECTION_CATALOG: Section[] = [
  { key: 'products', name: 'Productos' },
  { key: 'users', name: 'Usuarios' },
  { key: 'profiles', name: 'Perfiles' },
  { key: 'audit_log', name: 'Bitácora' },
];

export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '6abf324951cceeb26c0715fd',
    code: 'PRF-0002',
    name: 'Capturista de productos',
    sections: [{ key: 'products', name: 'Productos' }],
    created_at: '2026-10-01T18:30:00+00:00',
    updated_at: '2026-10-01T18:30:00+00:00',
    ...overrides,
  };
}
