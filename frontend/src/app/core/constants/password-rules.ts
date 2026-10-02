/**
 * Reglas de la contraseña nueva.
 * Deben coincidir con ResetPasswordRequest en el backend.
 */
export const PASSWORD_RULES = {
  minLength: 8,
  /** bcrypt ignora lo que pase de 72 bytes. */
  maxLength: 72,
  /** Al menos una letra (con o sin acento) y un número, como letters() y numbers() de Laravel. */
  letter: /\p{L}/u,
  number: /\p{N}/u,
} as const;
