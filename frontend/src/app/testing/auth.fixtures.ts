import { computed, signal } from '@angular/core';

import { NO_ACCESS_PATH, SECTION_LINKS } from '../core/constants/sections';
import { AuthUser, LoginResponse } from '../core/models/auth.model';
import { buildUser } from './user.fixtures';

/**
 * Datos de prueba de la sesión.
 * Solo los importan los archivos .spec.ts: no forman parte de la app.
 */
export const SESSION_STORAGE_KEY = 'examen-tap.session';

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    ...buildUser({ code: 'USR-0001', name: 'Administrador', email: 'admin@example.com' }),
    sections: [{ key: 'products', name: 'Productos' }],
    ...overrides,
  };
}

/** Respuesta de login con un token que vence dentro de una hora. */
export function buildLoginResponse(): LoginResponse {
  return {
    token: '1|token-de-prueba',
    token_type: 'Bearer',
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: buildAuthUser(),
  };
}

/** Guarda una sesión en localStorage como si el usuario hubiera iniciado sesión antes. */
export function storeSession(token: string, expiresAt: Date): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, expiresAt: expiresAt.toISOString() }));
}

/**
 * AuthService simulado para pruebas de pantallas y guards: la prueba decide quién
 * tiene sesión cambiando la señal "user". Reproduce la lógica de secciones del real.
 */
export function createAuthServiceStub() {
  const user = signal<AuthUser | null>(null);
  const hasSection = (key: string) => user()?.sections.some((section) => section.key === key) ?? false;

  return {
    user,
    currentUser: user.asReadonly(),
    isAuthenticated: computed(() => user() !== null),
    hasSection,
    homeUrl: () => SECTION_LINKS.find((link) => hasSection(link.key))?.path ?? NO_ACCESS_PATH,
  };
}
