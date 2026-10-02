import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Pantallas que requieren sesión: sin ella, lleva al login y recuerda a dónde volver. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** El login solo tiene sentido sin sesión: con sesión, lleva a su primera pantalla permitida. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  return auth.isAuthenticated() ? inject(Router).parseUrl(auth.homeUrl()) : true;
};
