import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResultRow } from "@/components/admin/result-row";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage, MatchWithTeams } from "@/lib/types";

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const stage = (
    STAGE_ORDER.includes(sp.stage as MatchStage) ? sp.stage : "groups"
  ) as MatchStage;

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
    .eq("stage", stage)
    .order("match_datetime", { ascending: true });
  const matches = (data as unknown as MatchWithTeams[]) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Carga el marcador y marca el partido como{" "}
        <strong>Finalizado</strong>. Los puntos se calculan automáticamente y el
        ranking se actualiza. Si corriges un marcador, los puntos se recalculan.
      </p>

      <div className="flex flex-wrap gap-2">
        {STAGE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/admin/results?stage=${s}`}
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="text-right">Local</TableHead>
                <TableHead className="text-center">Marcador</TableHead>
                <TableHead>Visitante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <ResultRow key={m.id} match={m} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
