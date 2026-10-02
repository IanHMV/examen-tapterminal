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

/** Cuerpo de POST /api/v1/auth/reset-password (esquema ResetPasswordInput en Swagger). */
export interface ResetPasswordInput {
  /** Lo que va después de "#" en el enlace del correo. */
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Respuesta que solo trae un mensaje para mostrar. */
export interface MessageResponse {
  message: string;
}
