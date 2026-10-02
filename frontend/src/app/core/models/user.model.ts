import { ProfileOption } from './profile.model';

/** Usuario tal como lo entrega el listado de la API (esquema User en Swagger). */
export interface User {
  id: string;
  code: string;
  name: string;
  /** Es el usuario para iniciar sesión. */
  email: string;
  /** Formato internacional sin espacios (+523141234567) o null. */
  phone: string | null;
  /** Cambia cuando cambia la foto, así el navegador nunca muestra una vieja. */
  photo_url: string;
  /** Fechas ISO 8601 en UTC; se muestran en hora local con DATE_TIME_FORMAT. */
  created_at: string;
  updated_at: string;
}

/** Usuario con sus perfiles (esquema UserDetail en Swagger). */
export interface UserDetail extends User {
  profiles: ProfileOption[];
}

/** Datos para crear o editar un usuario (esquema UserInput en Swagger). La foto va aparte. */
export interface UserInput {
  name: string;
  email: string;
  phone: string | null;
  profile_codes: string[];
}
