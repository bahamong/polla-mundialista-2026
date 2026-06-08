"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { maybeNotifyPhaseComplete, sendPhaseReportEmails } from "@/lib/email";
import type { MatchStage, MatchStatus, UserRole, UserStatus } from "@/lib/types";

type Result = { success?: true; error?: string; info?: string };

// --------------------------- RESULTADOS / PARTIDOS ---------------------------

export async function saveMatchResult(
  matchId: string,
  homeScore: number | null,
  awayScore: number | null,
  status: MatchStatus,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore, status })
    .eq("id", matchId);
  if (error) return { error: error.message };
  revalidatePath("/admin/results");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");

  // Si este resultado completó una fase, enviar el reporte por correo (una vez).
  if (status === "finished") {
    try {
      const { data: m } = await supabase
        .from("matches")
        .select("stage")
        .eq("id", matchId)
        .maybeSingle();
      const st = (m as { stage?: MatchStage } | null)?.stage;
      if (st) await maybeNotifyPhaseComplete(supabase, st);
    } catch {
      // No bloquear el guardado del resultado si el correo falla.
    }
  }
  return { success: true };
}

// Envío manual del reporte de una fase (respaldo / reenvío). Solo admin.
export async function sendPhaseReportManual(stage: MatchStage): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "superadmin")
    return { error: "No autorizado." };

  const res = await sendPhaseReportEmails(supabase, stage);
  if (res.skipped)
    return {
      error:
        "Falta configurar el correo (RESEND_API_KEY y REPORT_FROM_EMAIL).",
    };
  if (res.error && res.sent === 0)
    return { error: `No se pudo enviar: ${res.error}` };
  return {
    success: true,
    info: `Reporte de "${stage}" enviado a ${res.sent} participante(s).`,
  };
}

export async function updateMatch(
  matchId: string,
  fields: {
    home_team_id?: string | null;
    away_team_id?: string | null;
    home_placeholder?: string | null;
    away_placeholder?: string | null;
    match_datetime?: string;
    stadium?: string | null;
    city?: string | null;
    stage?: MatchStage;
    group_letter?: string | null;
    status?: MatchStatus;
  },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update(fields)
    .eq("id", matchId);
  if (error) return { error: error.message };
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  return { success: true };
}

export async function createMatch(fields: {
  fifa_match_number?: number | null;
  stage: MatchStage;
  group_letter?: string | null;
  home_placeholder?: string | null;
  away_placeholder?: string | null;
  match_datetime: string;
  stadium?: string | null;
  city?: string | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("matches").insert(fields);
  if (error) return { error: error.message };
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  return { success: true };
}

export async function deleteMatch(matchId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) return { error: error.message };
  revalidatePath("/admin/matches");
  return { success: true };
}

// --------------------------- EQUIPOS ---------------------------

export async function upsertTeam(fields: {
  id?: string;
  name: string;
  country_code?: string | null;
  flag_url?: string | null;
  group_letter?: string | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = fields.id
    ? await supabase
        .from("teams")
        .update({
          name: fields.name,
          country_code: fields.country_code,
          flag_url: fields.flag_url,
          group_letter: fields.group_letter,
        })
        .eq("id", fields.id)
    : await supabase.from("teams").insert({
        name: fields.name,
        country_code: fields.country_code,
        flag_url: fields.flag_url,
        group_letter: fields.group_letter,
      });
  if (error) return { error: error.message };
  revalidatePath("/admin/teams");
  return { success: true };
}

export async function deleteTeam(teamId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return { error: error.message };
  revalidatePath("/admin/teams");
  return { success: true };
}

// --------------------------- REGLAS DE ELIMINACIÓN ---------------------------

export async function upsertEliminationRule(
  stage: MatchStage,
  minimumPoints: number,
  active: boolean,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("elimination_rules")
    .upsert(
      { stage, minimum_points: minimumPoints, active },
      { onConflict: "stage" },
    );
  if (error) return { error: error.message };
  revalidatePath("/admin/rules");
  return { success: true };
}

// --------------------------- CONFIGURACIÓN ---------------------------

export async function updateSetting(
  key: string,
  value: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

// --------------------------- USUARIOS ---------------------------

export async function updateUser(
  userId: string,
  fields: { role?: UserRole; status?: UserStatus },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

// --------------------------- RPC: RECÁLCULO / ELIMINACIÓN ---------------------------

export async function recalculateAll(): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("pm_recalculate_all");
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { success: true, info: "Puntos recalculados para todo el torneo." };
}

export async function applyElimination(stage: MatchStage): Promise<Result> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pm_apply_elimination", {
    p_stage: stage,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return {
    success: true,
    info: `${data ?? 0} participante(s) eliminado(s) en la fase seleccionada.`,
  };
}
