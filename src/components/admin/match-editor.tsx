"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Save, Trash2 } from "lucide-react";
import { updateMatch, deleteMatch } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS } from "@/lib/constants";
import type { MatchWithTeams, Team } from "@/lib/types";

function toLocalInput(iso: string) {
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

export function MatchEditor({
  match,
  teams,
}: {
  match: MatchWithTeams;
  teams: Team[];
}) {
  const router = useRouter();
  const [homeTeam, setHomeTeam] = useState(match.home_team_id ?? "");
  const [awayTeam, setAwayTeam] = useState(match.away_team_id ?? "");
  const [datetime, setDatetime] = useState(toLocalInput(match.match_datetime));
  const [stadium, setStadium] = useState(match.stadium ?? "");
  const [city, setCity] = useState(match.city ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updateMatch(match.id, {
        home_team_id: homeTeam || null,
        away_team_id: awayTeam || null,
        match_datetime: datetime
          ? new Date(datetime).toISOString()
          : match.match_datetime,
        stadium: stadium || null,
        city: city || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("¿Eliminar este partido?")) return;
    startTransition(async () => {
      await deleteMatch(match.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{STAGE_LABELS[match.stage]}</Badge>
          {match.group_letter && (
            <Badge variant="muted">Grupo {match.group_letter}</Badge>
          )}
          <span className="text-muted-foreground">
            #{match.fifa_match_number ?? "—"}
          </span>
        </div>
        {(match.home_placeholder || match.away_placeholder) && (
          <span className="text-muted-foreground">
            {match.home_placeholder} vs {match.away_placeholder}
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Equipo local</label>
          <Select
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="h-8"
          >
            <option value="">— Sin definir (placeholder) —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Equipo visitante
          </label>
          <Select
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="h-8"
          >
            <option value="">— Sin definir (placeholder) —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">Fecha y hora</label>
          <Input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Estadio</label>
          <Input
            value={stadium}
            onChange={(e) => setStadium(e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Ciudad</label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={save} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar
        </Button>
        {saved && <span className="text-xs text-primary">Guardado ✓</span>}
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={isPending}
          className="ml-auto text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
