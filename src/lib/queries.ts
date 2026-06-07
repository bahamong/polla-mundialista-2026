import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, TournamentSetting } from "./types";

/** Devuelve el usuario auth actual o null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Devuelve el perfil del usuario autenticado (o null). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Exige sesión; redirige a /login si no hay. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Exige rol admin/superadmin; redirige a /dashboard si no. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "superadmin") {
    redirect("/dashboard");
  }
  return profile;
}

/** Configuración del torneo como diccionario clave->valor. */
export async function getSettings(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("tournament_settings").select("*");
  const map: Record<string, string> = {};
  (data as TournamentSetting[] | null)?.forEach((s) => {
    if (s.key) map[s.key] = s.value ?? "";
  });
  return map;
}

export interface PrizeInfo {
  participants: number;
  perPerson: number; // aporte neto al premio por persona (cuota - comisión)
  entryFee: number;
  platformFee: number;
  pool: number; // total acumulado
  currency: string;
  pct: [number, number, number];
  prizes: [number, number, number]; // monto para 1°, 2°, 3°
}

/**
 * Calcula el premio acumulado dinámicamente:
 * pool = (cuota - comisión plataforma) × participantes con cupo aprobado.
 */
export async function getPrizeInfo(): Promise<PrizeInfo> {
  const supabase = await createClient();
  const settings = await getSettings();

  const entryFee = Number(settings.entry_fee || 0);
  const platformFee = Number(settings.platform_fee || 0);
  const perPerson = Math.max(entryFee - platformFee, 0);
  const currency = settings.currency || "COP";
  const p1 = Number(settings.prize_pct_1 || 60);
  const p2 = Number(settings.prize_pct_2 || 30);
  const p3 = Number(settings.prize_pct_3 || 10);

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "participant")
    .eq("status", "active");

  const participants = count ?? 0;
  const pool = perPerson * participants;

  return {
    participants,
    perPerson,
    entryFee,
    platformFee,
    pool,
    currency,
    pct: [p1, p2, p3],
    prizes: [(pool * p1) / 100, (pool * p2) / 100, (pool * p3) / 100],
  };
}
