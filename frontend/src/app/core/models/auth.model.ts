import { Section } from './profile.model';
import { UserDetail } from './user.model';

/** Usuario con sesión iniciada (esquema AuthUser en Swagger). */
export interface AuthUser extends UserDetail {
  /** Secciones a las que tiene acceso: la suma de las de sus perfiles. */
  sections: Section[];
}

/** Respuesta de POST /api/v1/auth/login. */
export interface LoginResponse {
  token: string;
  token_type: 'Bearer';
  /** Fecha ISO 8601 en que vence el token. */
  expires_at: string;
  user: AuthUser;
}
