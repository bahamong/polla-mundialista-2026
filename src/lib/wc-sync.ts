import { createPublicClient } from "@/lib/supabase/public";

/**
 * Sincronización de marcadores en vivo desde la API pública worldcup26.ir.
 *
 * Diseño / seguridad:
 * - Solo escribe marcador + estado 'live' (vía RPC pm_apply_live_scores, que
 *   NUNCA marca 'finished' ni toca partidos ya finalizados). Finalizar — que
 *   reparte puntos y avanza llaves — lo confirma el admin manualmente.
 * - El mapeo de equipos es por código de país (country_code), con override
 *   para Escocia (SCO→gb-sct) e Inglaterra (ENG→gb-eng).
 * - Si la fuente está caída o cambia, la función falla suave y el flujo manual
 *   del admin sigue intacto.
 */

const SOURCE = "https://worldcup26.ir";

interface ExtTeam {
  id: string;
  iso2?: string;
  fifa_code?: string;
}
interface ExtGame {
  home_team_id: string;
  away_team_id: string;
  home_score?: string;
  away_score?: string;
  finished?: string; // "TRUE" | "FALSE"
  time_elapsed?: string; // "notstarted" | minutos | ...
}

/** Devuelve el country_code (como en nuestra tabla teams) para un equipo externo. */
function toOurCode(t: ExtTeam): string | null {
  const fifa = (t.fifa_code || "").toUpperCase();
  if (fifa === "SCO") return "gb-sct";
  if (fifa === "ENG") return "gb-eng";
  const iso = (t.iso2 || "").toLowerCase();
  return iso || null;
}

/** Un partido cuenta como "en juego o terminado" (hay marcador que reflejar). */
function hasStarted(g: ExtGame): boolean {
  if ((g.finished || "").toUpperCase() === "TRUE") return true;
  const te = (g.time_elapsed || "").toLowerCase();
  return te !== "" && te !== "notstarted";
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SOURCE}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface SyncResult {
  ok: boolean;
  started: number; // partidos en juego/terminados según la fuente
  matched: number; // resueltos a un partido nuestro
  updated: number; // efectivamente actualizados
  finalized: number; // marcados como 'finished' en esta corrida
  error?: string;
}

export async function syncLiveScores(secret: string): Promise<SyncResult> {
  try {
    const [teamsRes, gamesRes] = await Promise.all([
      fetchJson<{ teams: ExtTeam[] }>("/get/teams"),
      fetchJson<{ games: ExtGame[] }>("/get/games"),
    ]);

    const codeByExtId = new Map<string, string>();
    for (const t of teamsRes.teams ?? []) {
      const code = toOurCode(t);
      if (code) codeByExtId.set(t.id, code);
    }

    const payload: Array<{
      home_code: string;
      away_code: string;
      home_score: string;
      away_score: string;
      finished: boolean;
    }> = [];

    for (const g of gamesRes.games ?? []) {
      if (!hasStarted(g)) continue;
      const home = codeByExtId.get(g.home_team_id);
      const away = codeByExtId.get(g.away_team_id);
      if (!home || !away) continue;
      payload.push({
        home_code: home,
        away_code: away,
        home_score: g.home_score ?? "0",
        away_score: g.away_score ?? "0",
        finished: (g.finished || "").toUpperCase() === "TRUE",
      });
    }

    if (payload.length === 0) {
      return { ok: true, started: 0, matched: 0, updated: 0, finalized: 0 };
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("pm_apply_live_scores", {
      p_secret: secret,
      p_games: payload,
    });
    if (error) throw new Error(error.message);

    const summary = (data ?? {}) as {
      matched?: number;
      updated?: number;
      finalized?: number;
    };
    return {
      ok: true,
      started: payload.length,
      matched: summary.matched ?? 0,
      updated: summary.updated ?? 0,
      finalized: summary.finalized ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      started: 0,
      matched: 0,
      updated: 0,
      finalized: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
