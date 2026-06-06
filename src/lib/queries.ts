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
