import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamFlag } from "@/components/team-flag";
import { PREDICTION_LABELS, STAGE_LABELS } from "@/lib/constants";
import type { MatchWithTeams, Prediction } from "@/lib/types";

type PredWithMatch = Prediction & { match: MatchWithTeams };

export default async function MyPredictionsPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const { data } = await supabase
    .from("predictions")
    .select(
      "*, match:match_id(*, home_team:home_team_id(*), away_team:away_team_id(*))",
    )
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });

  const preds = (data as unknown as PredWithMatch[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis predicciones</h1>
        <Badge variant="outline">{preds.length} en total</Badge>
      </div>

      {preds.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Aún no has hecho predicciones.{" "}
            <Link href="/matches" className="text-primary">
              Ve a apostar
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {preds.map((p) => {
            const m = p.match;
            const finished = m.status === "finished";
            return (
              <Card key={p.id} className="hover-lift">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {STAGE_LABELS[m.stage]}
                    {m.group_letter ? ` · Grupo ${m.group_letter}` : ""}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.match_datetime), "d MMM HH:mm", {
                      locale: es,
                    })}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <TeamFlag
                      team={m.home_team}
                      placeholder={m.home_placeholder}
                      className="flex-1"
                    />
                    <span className="px-2 text-sm">
                      {finished &&
                      m.home_score !== null &&
                      m.away_score !== null
                        ? `${m.home_score} - ${m.away_score}`
                        : "vs"}
                    </span>
                    <TeamFlag
                      team={m.away_team}
                      placeholder={m.away_placeholder}
                      align="right"
                      className="flex-1 justify-end"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      Tu pronóstico:{" "}
                      <span className="font-semibold text-foreground">
                        {PREDICTION_LABELS[p.predicted_result]}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {p.locked ? (
                        <Badge variant="muted">Bloqueada</Badge>
                      ) : (
                        <Link href={`/matches/${m.id}`}>
                          <Badge variant="outline">Editar</Badge>
                        </Link>
                      )}
                      {finished &&
                        (p.points_awarded > 0 ? (
                          <Badge variant="success">
                            +{p.points_awarded}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">0</Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
