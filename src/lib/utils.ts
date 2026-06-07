import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

// =====================================================================
// Fechas en hora de Colombia (America/Bogota) y formato 12 horas
// =====================================================================
const BOGOTA_TZ = "America/Bogota";

/** Hora limpia en 12h (ej. "2:00 PM"). */
function timeBogota(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOGOTA_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
}

/** Fecha en español, hora Colombia (ej. "jue 11 jun · 2:00 PM"). */
export function formatMatchDateTime(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  return `${date} · ${timeBogota(d)}`;
}

/** Fecha larga en español, hora Colombia (ej. "jueves, 11 de junio · 2:00 PM"). */
export function formatMatchDateTimeLong(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return `${date} · ${timeBogota(d)}`;
}
