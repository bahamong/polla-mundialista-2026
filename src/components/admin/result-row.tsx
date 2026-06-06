"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check } from "lucide-react";
import { saveMatchResult } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MATCH_STATUS_LABELS } from "@/lib/constants";
import type { MatchStatus, MatchWithTeams } from "@/lib/types";

const STATUSES: MatchStatus[] = [
  "scheduled",
  "live",
  "finished",
  "suspended",
  "postponed",
];

export function ResultRow({ match }: { match: MatchWithTeams }) {
  const router = useRouter();
  const [home, setHome] = useState<string>(
    match.home_score?.toString() ?? "",
  );
  const [away, setAway] = useState<string>(
    match.away_score?.toString() ?? "",
  );
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const homeName = match.home_team?.name ?? match.home_placeholder ?? "Local";
  const awayName =
    match.away_team?.name ?? match.away_placeholder ?? "Visitante";

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveMatchResult(
        match.id,
        home === "" ? null : Number(home),
        away === "" ? null : Number(away),
        status,
      );
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        router.refresh();
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground">
        #{match.fifa_match_number ?? "—"}
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        {homeName}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Input
            value={home}
            onChange={(e) => setHome(e.target.value)}
            type="number"
            min={0}
            className="h-8 w-14 text-center"
          />
          <span>-</span>
          <Input
            value={away}
            onChange={(e) => setAway(e.target.value)}
            type="number"
            min={0}
            className="h-8 w-14 text-center"
          />
        </div>
      </TableCell>
      <TableCell className="text-sm font-medium">{awayName}</TableCell>
      <TableCell>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as MatchStatus)}
          className="h-8 w-36"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {MATCH_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={save} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </TableCell>
    </TableRow>
  );
}
