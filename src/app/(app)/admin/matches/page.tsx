import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { MatchEditor } from "@/components/admin/match-editor";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage, MatchWithTeams, Team } from "@/lib/types";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const stage = (
    STAGE_ORDER.includes(sp.stage as MatchStage) ? sp.stage : "round_32"
  ) as MatchStage;

  const supabase = await createClient();
  const [{ data: matchesData }, { data: teamsData }] = await Promise.all([
    supabase
      .from("matches")
      .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
      .eq("stage", stage)
      .order("match_datetime", { ascending: true }),
    supabase.from("teams").select("*").order("name", { ascending: true }),
  ]);

  const matches = (matchesData as unknown as MatchWithTeams[]) ?? [];
  const teams = (teamsData as Team[]) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Asigna los equipos clasificados a los cruces de eliminación, ajusta
        fechas, estadios y ciudades. Hasta que un partido no tenga ambos equipos
        definidos, no se podrá apostar.
      </p>

      <div className="flex flex-wrap gap-2">
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/admin/matches?stage=${s}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              stage === s
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted-foreground hover:border-accent/50",
            )}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay partidos en esta fase.
            </p>
          ) : (
            matches.map((m) => (
              <MatchEditor key={m.id} match={m} teams={teams} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
