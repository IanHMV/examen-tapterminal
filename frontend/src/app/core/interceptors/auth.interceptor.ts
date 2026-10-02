import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NO_ACCESS_PATH } from '../constants/sections';
import { AuthService } from '../services/auth.service';

/**
 * Agrega el token a cada petición a la API y reacciona cuando la sesión ya no sirve.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Solo a nuestra API: el token nunca debe viajar a otros dominios. Tampoco reemplaza un
  // Authorization que la petición ya traiga (el Basic del inicio de sesión).
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const token = auth.token();

  const authorized =
    isApiRequest && token && !request.headers.has('Authorization')
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: el token venció o se revocó. Se olvida la sesión y se pide iniciarla de nuevo,
      // recordando a qué pantalla volver. (El 401 del propio login lo maneja su formulario.)
      if (error.status === 401 && isApiRequest && !request.url.endsWith('/auth/login')) {
        auth.clearSession();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }

      // 403: sus perfiles ya no incluyen esa sección (alguien los cambió). Se actualiza
      // el usuario para que el menú refleje sus permisos y se muestra "Sin acceso".
      if (error.status === 403 && isApiRequest) {
        auth.refreshUser().subscribe(() => router.navigate([NO_ACCESS_PATH]));
      }

      return throwError(() => error);
    }),
  );
};
