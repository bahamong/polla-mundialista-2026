// Preferencia "Mantener sesión iniciada".
// Si la cookie pm-remember = "0" -> cookies de sesión (se borran al cerrar el navegador).
// En cualquier otro caso (por defecto) -> sesión persistente (~400 días).
export const REMEMBER_COOKIE = "pm-remember";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 400; // 400 días en segundos

/** Lee la preferencia desde una cadena de cookies (o un getter). */
export function wantsPersistent(remember: string | undefined | null): boolean {
  return remember !== "0";
}
