import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MapPin, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchStatusBadge } from "@/components/status-badges";
import { TeamFlag } from "@/components/team-flag";
import { Countdown } from "@/components/countdown";
import { PredictionForm } from "@/components/prediction-form";
import { STAGE_LABELS } from "@/lib/constants";
import type { MatchWithTeams, Prediction } from "@/lib/types";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const { data } = await supabase
    .from("matches")
    .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const match = data as unknown as MatchWithTeams;

  const { data: pred } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("match_id", id)
    .maybeSingle();
  const prediction = pred as Prediction | null;

  const teamsDefined = !!match.home_team_id && !!match.away_team_id;
  const closed =
    !match.bet_closes_at || new Date(match.bet_closes_at) <= new Date();
  const isScheduled = match.status === "scheduled";
  const isActive = profile.status === "active";
  const canBet = isActive && teamsDefined && isScheduled && !closed;
  const finished = match.status === "finished";

  let reason: string | undefined;
  if (!isActive) reason = "Necesitas un cupo aprobado para apostar.";
  else if (!teamsDefined) reason = "Equipos aún no definidos para esta fase.";
  else if (!isScheduled) reason = "Este partido ya no admite apuestas.";
  else if (closed) reason = "Las apuestas para este partido están cerradas.";

  const homeName = match.home_team?.name ?? match.home_placeholder ?? "Local";
  const awayName =
    match.away_team?.name ?? match.away_placeholder ?? "Visitante";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a partidos
      </Link>

      <Card>
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{STAGE_LABELS[match.stage]}</Badge>
            {match.group_letter && (
              <Badge variant="muted">Grupo {match.group_letter}</Badge>
            )}
            {match.fifa_match_number && (
              <span className="text-muted-foreground">
                Partido #{match.fifa_match_number}
              </span>
            )}
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <TeamFlag team={match.home_team} placeholder={match.home_placeholder} showName={false} className="scale-150" />
              <span className="font-semibold">{homeName}</span>
            </div>
            <div className="text-center">
              {finished &&
              match.home_score !== null &&
              match.away_score !== null ? (
                <span className="text-3xl font-bold">
                  {match.home_score} - {match.away_score}
                </span>
              ) : (
                <span className="text-lg text-muted-foreground">vs</span>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <TeamFlag team={match.away_team} placeholder={match.away_placeholder} showName={false} className="scale-150" />
              <span className="font-semibold">{awayName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(
                new Date(match.match_datetime),
                "EEEE d 'de' MMMM, HH:mm",
                { locale: es },
              )}
            </span>
            {match.stadium && match.stadium !== "Por definir" && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {match.stadium}
                {match.city ? `, ${match.city}` : ""}
              </span>
            )}
          </div>

          {isScheduled && match.bet_closes_at && (
            <div className="text-center">
              <Countdown closesAt={match.bet_closes_at} />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Tu predicción</h3>
            <PredictionForm
              matchId={match.id}
              homeName={homeName}
              awayName={awayName}
              current={prediction?.predicted_result ?? null}
              canBet={canBet}
              reason={reason}
            />
          </div>

          {finished && prediction && (
            <div className="rounded-lg border border-border p-3 text-center text-sm">
              {prediction.points_awarded > 0 ? (
                <span className="font-semibold text-primary">
                  ✓ Acertaste · +{prediction.points_awarded} punto(s)
                </span>
              ) : (
                <span className="text-destructive">
                  ✗ No acertaste este partido
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
