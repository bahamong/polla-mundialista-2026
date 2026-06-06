import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import { MatchCard } from "@/components/match-card";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage, MatchWithTeams, Prediction } from "@/lib/types";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const stage = (
    STAGE_ORDER.includes(sp.stage as MatchStage) ? sp.stage : "groups"
  ) as MatchStage;

  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const { data: matchesData } = await supabase
    .from("matches")
    .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
    .eq("stage", stage)
    .order("match_datetime", { ascending: true });
  const matches = (matchesData as unknown as MatchWithTeams[]) ?? [];

  const matchIds = matches.map((m) => m.id);
  const { data: predsData } = matchIds.length
    ? await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", profile.user_id)
        .in("match_id", matchIds)
    : { data: [] };
  const predMap = new Map<string, Prediction>();
  (predsData as Prediction[] | null)?.forEach((p) =>
    predMap.set(p.match_id, p),
  );

  const isActive = profile.status === "active";

  // Agrupar por letra de grupo cuando es fase de grupos
  const grouped: Record<string, MatchWithTeams[]> = {};
  if (stage === "groups") {
    for (const m of matches) {
      const k = m.group_letter ?? "—";
      (grouped[k] ||= []).push(m);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Partidos</h1>

      {/* Filtro de fases */}
      <div className="flex flex-wrap gap-2">
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/matches?stage=${s}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              stage === s
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay partidos en esta fase todavía.
        </p>
      ) : stage === "groups" ? (
        <div className="space-y-8">
          {Object.keys(grouped)
            .sort()
            .map((letter) => (
              <section key={letter}>
                <h2 className="mb-3 text-lg font-semibold">Grupo {letter}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {grouped[letter].map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      prediction={predMap.get(m.id)}
                      userActive={isActive}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predMap.get(m.id)}
              userActive={isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
