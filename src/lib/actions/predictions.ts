"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PredictionResult } from "@/lib/types";

export async function savePrediction(
  matchId: string,
  result: PredictionResult,
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // Validación de servidor: cargar el partido y verificar cierre + equipos.
  const { data: match } = await supabase
    .from("matches")
    .select("id, bet_closes_at, status, home_team_id, away_team_id")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Partido no encontrado." };
  if (!match.home_team_id || !match.away_team_id)
    return { error: "Los equipos de este partido aún no están definidos." };
  if (match.status !== "scheduled")
    return { error: "Este partido ya no admite apuestas." };
  if (match.bet_closes_at && new Date(match.bet_closes_at) <= new Date())
    return { error: "Las apuestas para este partido están cerradas." };

  // Upsert (RLS valida estado activo + cierre nuevamente en la BD).
  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      predicted_result: result,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/my-predictions");
  revalidatePath("/dashboard");
  return { success: true };
}
