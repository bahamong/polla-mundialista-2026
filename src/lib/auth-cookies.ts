// Preferencia "Mantener sesión iniciada".
// pm-remember = "0"  -> cookie de sesión (se borra al cerrar el navegador).
// pm-remember = "1" / ausente -> sesión persistente máximo 30 días.
export const REMEMBER_COOKIE = "pm-remember";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 días en segundos

export function wantsPersistent(remember: string | undefined | null): boolean {
  return remember !== "0";
}
