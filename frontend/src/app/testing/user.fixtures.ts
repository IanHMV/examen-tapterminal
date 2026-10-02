import { ProfileOption } from '../core/models/profile.model';
import { UserDetail } from '../core/models/user.model';

/**
 * Datos de prueba de usuarios.
 * Solo los importan los archivos .spec.ts: no forman parte de la app.
 */
export const PROFILE_OPTIONS: ProfileOption[] = [
  { code: 'PRF-0001', name: 'Administrador' },
  { code: 'PRF-0002', name: 'Capturista de productos' },
];

export function buildUser(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    id: '6abf3d46e2bdd0d7de07dda4',
    code: 'USR-0002',
    name: 'Ana López',
    email: 'ana.lopez@tapterminal.com',
    phone: '+523141234567',
    // Imagen en línea (data:) para que las pruebas no descarguen nada por red.
    photo_url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    created_at: '2026-10-01T18:30:00+00:00',
    updated_at: '2026-10-01T18:30:00+00:00',
    profiles: [{ code: 'PRF-0002', name: 'Capturista de productos' }],
    ...overrides,
  };
}

/** Archivo de imagen falso para simular la foto que elige el usuario. */
export function buildPhoto(name = 'foto.png', type = 'image/png', size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}
