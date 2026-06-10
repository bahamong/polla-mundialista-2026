import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaderboardRow, MatchStage, TransparencyRow } from "@/lib/types";
import type { ReportStanding } from "@/lib/reports";
import { rankActive } from "@/lib/utils";

export interface ReportData {
  rows: TransparencyRow[];
  standings: ReportStanding[];
  currency: string;
  winnerPrize: number;
}

/**
 * Reúne los datos para el reporte (detalle de predicciones de partidos
 * cerrados + tabla de posiciones + premio), usando un cliente Supabase dado.
 */
export async function getReportData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, "public", any>,
  stage?: MatchStage | "all",
): Promise<ReportData> {
  const { data: tr } = await supabase.rpc("pm_transparency");
  let rows = ((tr as TransparencyRow[]) ?? []).slice();
  if (stage && stage !== "all") rows = rows.filter((r) => r.stage === stage);

  const { data: lb } = await supabase.rpc("pm_leaderboard");
  const standings: ReportStanding[] = rankActive((lb as LeaderboardRow[]) ?? []).map(
    (r) => ({
      position: r.position,
      full_name: r.full_name,
      total_points: r.total_points,
      hits: r.hits,
      matches_played: r.matches_played,
    }),
  );

  const { data: settingsRows } = await supabase
    .from("tournament_settings")
    .select("key,value");
  const map: Record<string, string> = {};
  (settingsRows as { key: string; value: string | null }[] | null)?.forEach(
    (s) => {
      map[s.key] = s.value ?? "";
    },
  );
  const entry = Number(map.entry_fee || 0);
  const platform = Number(map.platform_fee || 0);
  const pct1 = Number(map.prize_pct_1 || 100);
  const currency = map.currency || "COP";

  const { data: cnt } = await supabase.rpc("pm_active_participant_count");
  const pool = Math.max(entry - platform, 0) * Number(cnt ?? 0);
  const winnerPrize = (pool * pct1) / 100;

  return { rows, standings, currency, winnerPrize };
}
