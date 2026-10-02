import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NO_ACCESS_PATH, SECTION_LINKS } from '../constants/sections';
import { ApiResource } from '../models/api.model';
import { AuthUser, LoginResponse, MessageResponse, ResetPasswordInput } from '../models/auth.model';

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

  /** Claves de las secciones permitidas (por ejemplo, "products"). */
  private readonly sectionKeys = computed(() => new Set(this.user()?.sections.map((section) => section.key) ?? []));

  hasSection(key: string): boolean {
    return this.sectionKeys().has(key);
  }

  /** Primera pantalla permitida, en el orden del menú; "Sin acceso" si no tiene ninguna. */
  homeUrl(): string {
    return SECTION_LINKS.find((link) => this.hasSection(link.key))?.path ?? NO_ACCESS_PATH;
  }

  /** Token vigente para el encabezado Authorization, o null si no hay o ya venció. */
  token(): string | null {
    const session = this.session();

    return session && new Date(session.expiresAt) > new Date() ? session.token : null;
  }

  /**
   * Las credenciales van en el encabezado Authorization: Basic base64(correo:contraseña),
   * nunca en el cuerpo de la petición. HTTPS cifra el encabezado en el camino.
   */
  login(email: string, password: string): Observable<AuthUser> {
    const headers = new HttpHeaders({ Authorization: `Basic ${toBase64(`${email}:${password}`)}` });

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, null, { headers }).pipe(
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

  /**
   * Vuelve a pedir el usuario (sus perfiles pudieron cambiar) para actualizar el menú.
   * Si falla, deja la sesión como estaba: el interceptor ya maneja un 401.
   */
  refreshUser(): Observable<void> {
    return this.http.get<ApiResource<AuthUser>>(`${this.baseUrl}/me`).pipe(
      tap((response) => this.user.set(response.data)),
      map(() => undefined),
      catchError(() => of(undefined)),
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

  /** Pide el enlace para elegir una contraseña nueva. La API responde lo mismo exista o no el correo. */
  forgotPassword(email: string): Observable<string> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/forgot-password`, { email })
      .pipe(map((response) => response.message));
  }

  /** Guarda la contraseña nueva con el enlace del correo. La API cierra todas las sesiones de ese usuario. */
  resetPassword(input: ResetPasswordInput): Observable<string> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/reset-password`, input)
      .pipe(map((response) => response.message));
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

/** Base64 de un texto UTF-8 (btoa solo acepta Latin-1 y fallaría con una contraseña con "ñ"). */
function toBase64(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

function readSession(): StoredSession | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as StoredSession | null;

    return stored?.token && stored.expiresAt ? stored : null;
  } catch {
    return null;
  }
}
