import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';

import { NO_ACCESS_PATH } from '../constants/sections';
import { AuthService } from '../services/auth.service';

/**
 * Deja entrar solo a pantallas de secciones que el usuario tiene en sus perfiles.
 * Cada ruta indica su sección en "data": { section: 'products' }. Sin ella, la ruta
 * no requiere sección (por ejemplo, la pantalla "Sin acceso").
 *
 * Es una ayuda para el usuario (no ve pantallas que no puede usar). La seguridad
 * real está en la API, que responde 403 aunque alguien salte esta revisión.
 */
export const sectionGuard: CanActivateChildFn = (childRoute) => {
  const section = childRoute.data['section'] as string | undefined;

  if (!section || inject(AuthService).hasSection(section)) {
    return true;
  }

  return inject(Router).createUrlTree([NO_ACCESS_PATH]);
};
