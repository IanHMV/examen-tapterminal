/**
 * Pantallas de cada sección del sistema, en el orden del menú.
 * La clave es la misma que usa la API (App\Enums\Section).
 */
export const SECTION_LINKS = [
  { key: 'products', label: 'Productos', path: '/productos' },
  { key: 'users', label: 'Usuarios', path: '/usuarios' },
  { key: 'profiles', label: 'Perfiles', path: '/perfiles' },
  { key: 'audit_log', label: 'Bitácora', path: '/bitacora' },
] as const;

/** Pantalla para quien no tiene ninguna sección asignada (o entra a una que no le toca). */
export const NO_ACCESS_PATH = '/sin-acceso';
