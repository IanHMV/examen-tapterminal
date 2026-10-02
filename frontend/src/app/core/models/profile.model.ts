/** Sección del sistema a la que un perfil da acceso (esquema Section en Swagger). */
export interface Section {
  key: string;
  name: string;
}

/** Perfil tal como lo entrega la API (esquema Profile en Swagger). */
export interface Profile {
  id: string;
  code: string;
  name: string;
  /** En el orden del catálogo de secciones. */
  sections: Section[];
  /** Fechas ISO 8601 en UTC; se muestran en hora local con DATE_TIME_FORMAT. */
  created_at: string;
  updated_at: string;
}

/** Datos para crear o editar un perfil (esquema ProfileInput en Swagger). */
export interface ProfileInput {
  name: string;
  /** Claves de las secciones, por ejemplo ["products", "users"]. */
  sections: string[];
}
