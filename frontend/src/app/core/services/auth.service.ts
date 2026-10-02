import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/api.model';
import { AuthUser, LoginResponse } from '../models/auth.model';

/** Token guardado en el navegador para no pedir la contraseña en cada recarga. */
interface StoredSession {
  token: string;
  expiresAt: string;
}

const STORAGE_KEY = 'examen-tap.session';

/**
 * Sesión del usuario: inicia, recupera y cierra la sesión con la API (Sanctum).
 *
 * El token vive en localStorage para sobrevivir a una recarga. La API lo hace
 * vencer en 8 horas y lo revoca al cerrar sesión, así que un token copiado deja
 * de servir. Angular evita inyectar HTML de usuarios, que es el riesgo (XSS)
 * de guardar un token en el navegador.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly session = signal<StoredSession | null>(readSession());
  private readonly user = signal<AuthUser | null>(null);

  /** Usuario con sesión iniciada, o null. */
  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  /** Token vigente para el encabezado Authorization, o null si no hay o ya venció. */
  token(): string | null {
    const session = this.session();

    return session && new Date(session.expiresAt) > new Date() ? session.token : null;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap((response) => {
        this.saveSession({ token: response.token, expiresAt: response.expires_at });
        this.user.set(response.user);
      }),
      map((response) => response.user),
    );
  }

  /**
   * Recupera la sesión al abrir la app: si hay un token guardado, pide el usuario.
   * Nunca falla: si el token ya no sirve, simplemente se queda sin sesión.
   */
  restoreSession(): Observable<void> {
    if (!this.token()) {
      this.clearSession();
      return of(undefined);
    }

    return this.http.get<ApiResource<AuthUser>>(`${this.baseUrl}/me`).pipe(
      tap((response) => this.user.set(response.data)),
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  /** Revoca el token en la API y borra la sesión local, aunque la API no responda. */
  logout(): Observable<void> {
    if (!this.token()) {
      this.clearSession();
      return of(undefined);
    }

    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      catchError(() => of(undefined)),
      map(() => undefined),
      finalize(() => this.clearSession()),
    );
  }

  /** Olvida la sesión local (por ejemplo, cuando la API responde 401). */
  clearSession(): void {
    this.session.set(null);
    this.user.set(null);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Navegación privada o almacenamiento bloqueado: no hay nada que borrar.
    }
  }

  private saveSession(session: StoredSession): void {
    this.session.set(session);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Sin almacenamiento, la sesión dura mientras la pestaña siga abierta.
    }
  }
}

function readSession(): StoredSession | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as StoredSession | null;

    return stored?.token && stored.expiresAt ? stored : null;
  } catch {
    return null;
  }
}
