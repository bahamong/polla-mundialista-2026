import { MapPin, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchStatusBadge } from "@/components/status-badges";
import { TeamFlag } from "@/components/team-flag";
import { Countdown } from "@/components/countdown";
import { PredictionForm } from "@/components/prediction-form";
import { STAGE_LABELS } from "@/lib/constants";
import { formatMatchDateTime } from "@/lib/utils";
import type { MatchWithTeams, Prediction } from "@/lib/types";

export function MatchCard({
  match,
  prediction,
  userActive,
}: {
  match: MatchWithTeams;
  prediction?: Prediction | null;
  userActive: boolean;
}) {
  const teamsDefined = !!match.home_team_id && !!match.away_team_id;
  const closed =
    !match.bet_closes_at || new Date(match.bet_closes_at) <= new Date();
  const isScheduled = match.status === "scheduled";
  const finished = match.status === "finished";

  const canBet = userActive && teamsDefined && isScheduled && !closed;

  let reason: string | undefined;
  if (!userActive) reason = "Necesitas un cupo aprobado para apostar.";
  else if (!teamsDefined) reason = "Equipos aún no definidos para esta fase.";
  else if (!isScheduled) reason = "Este partido ya no admite apuestas.";
  else if (closed) reason = "Las apuestas para este partido están cerradas.";

  const homeName = match.home_team?.name ?? match.home_placeholder ?? "Local";
  const awayName = match.away_team?.name ?? match.away_placeholder ?? "Visitante";

  return (
    <Card className="hover-lift animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{STAGE_LABELS[match.stage]}</Badge>
          {match.group_letter && (
            <Badge variant="muted">Grupo {match.group_letter}</Badge>
          )}
          {match.fifa_match_number && (
            <span className="text-muted-foreground">
              #{match.fifa_match_number}
            </span>
          )}
        </div>
        <MatchStatusBadge status={match.status} />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <TeamFlag
            team={match.home_team}
            placeholder={match.home_placeholder}
            className="flex-1"
          />
          <div className="px-2 text-center">
            {finished &&
            match.home_score !== null &&
            match.away_score !== null ? (
              <span className="text-xl font-bold">
                {match.home_score} - {match.away_score}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">vs</span>
            )}
          </div>
          <TeamFlag
            team={match.away_team}
            placeholder={match.away_placeholder}
            align="right"
            className="flex-1 justify-end"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatMatchDateTime(match.match_datetime)}
          </span>
          {match.city && match.city !== "Por definir" && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.city}
            </span>
          )}
          {isScheduled && match.bet_closes_at && (
            <Countdown closesAt={match.bet_closes_at} />
          )}
        </div>

        <PredictionForm
          matchId={match.id}
          homeName={homeName}
          awayName={awayName}
          current={prediction?.predicted_result ?? null}
          canBet={canBet}
          reason={reason}
        />

        {finished && prediction && (
          <div className="text-xs">
            {prediction.points_awarded > 0 ? (
              <span className="font-semibold text-primary">
                ✓ Acertaste (+{prediction.points_awarded})
              </span>
            ) : (
              <span className="text-destructive">✗ No acertaste</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
