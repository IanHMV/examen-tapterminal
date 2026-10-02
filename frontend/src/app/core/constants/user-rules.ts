/**
 * Reglas de validación del usuario.
 * Deben coincidir con UpdateUserRequest y UpdateUserPhotoRequest en el backend.
 */
export const USER_RULES = {
  nameMaxLength: 100,
  /** E.164: "+", lada del país y número (de 8 a 15 dígitos), sin espacios. */
  phoneFormat: /^\+[1-9]\d{7,14}$/,
  photoTypes: ['image/jpeg', 'image/png', 'image/webp'],
  photoMaxBytes: 2 * 1024 * 1024,
} as const;
