/**
 * Pantallas de cada sección del sistema, en el orden del menú.
 * La clave es la misma que usa la API (App\Enums\Section).
 * La bitácora ("audit_log") se agrega cuando exista su pantalla (TICK-22).
 */
export const SECTION_LINKS = [
  { key: 'products', label: 'Productos', path: '/productos' },
  { key: 'users', label: 'Usuarios', path: '/usuarios' },
  { key: 'profiles', label: 'Perfiles', path: '/perfiles' },
] as const;

/** Pantalla para quien no tiene ninguna sección asignada (o entra a una que no le toca). */
export const NO_ACCESS_PATH = '/sin-acceso';
