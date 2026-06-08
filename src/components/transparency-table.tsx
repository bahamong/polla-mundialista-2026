"use client";

import { useMemo, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatMatchDateTime } from "@/lib/utils";
import { PREDICTION_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage, TransparencyRow } from "@/lib/types";

function realResult(r: TransparencyRow): "home" | "draw" | "away" | null {
  if (r.match_status !== "finished" || r.home_score == null || r.away_score == null)
    return null;
  if (r.home_score > r.away_score) return "home";
  if (r.home_score < r.away_score) return "away";
  return "draw";
}

export function TransparencyTable({ rows }: { rows: TransparencyRow[] }) {
  const [stage, setStage] = useState<MatchStage | "all">("all");

  const stagesPresent = useMemo(
    () => STAGE_ORDER.filter((s) => rows.some((r) => r.stage === s)),
    [rows],
  );

  const filtered = useMemo(
    () => (stage === "all" ? rows : rows.filter((r) => r.stage === stage)),
    [rows, stage],
  );

  // Resumen de puntos por participante (en el conjunto filtrado)
  const summary = useMemo(() => {
    const map = new Map<string, { name: string; pts: number; hits: number; total: number }>();
    for (const r of filtered) {
      const cur = map.get(r.user_id) ?? {
        name: r.full_name ?? "Participante",
        pts: 0,
        hits: 0,
        total: 0,
      };
      cur.pts += r.points_awarded;
      if (r.points_awarded > 0) cur.hits += 1;
      cur.total += 1;
      map.set(r.user_id, cur);
    }
    return [...map.values()].sort((a, b) => b.pts - a.pts);
  }, [filtered]);

  function downloadExcel() {
    // Genera el Excel en el servidor (estilizado) y lo descarga.
    window.location.href = `/api/report?stage=${stage}`;
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Aquí puedes auditar las predicciones de <strong>todos</strong> los
            participantes y los resultados de cada partido. Por juego justo,
            solo se muestran los partidos cuya hora de cierre ya pasó (nadie ve
            las apuestas ajenas antes del cierre). Exporta los datos a CSV para
            tener tu propia evidencia.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStage("all")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            stage === "all"
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          Todas
        </button>
        {stagesPresent.map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              stage === s
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
        <Button onClick={downloadExcel} className="ml-auto gap-2" size="sm">
          <Download className="h-4 w-4" />
          Descargar Excel {stage === "all" ? "(todo)" : "(fase)"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Todavía no hay partidos cerrados. Cuando cierren las apuestas de los
            primeros partidos, aquí aparecerán las predicciones de todos.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen de puntos (fase / total) */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Puntos {stage === "all" ? "totales" : `en ${STAGE_LABELS[stage]}`}
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-secondary/50 px-3 py-1 text-xs"
                  >
                    <span className="font-bold text-primary">{i + 1}.</span>{" "}
                    {s.name}{" "}
                    <span className="font-semibold">· {s.pts} pts</span>{" "}
                    <span className="text-muted-foreground">
                      ({s.hits}/{s.total})
                    </span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead className="hidden md:table-cell">Fase</TableHead>
                    <TableHead>Partido</TableHead>
                    <TableHead className="text-center">Marcador</TableHead>
                    <TableHead>Predicción</TableHead>
                    <TableHead className="text-center">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => {
                    const res = realResult(r);
                    const finished = r.match_status === "finished";
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {r.full_name ?? "Participante"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {STAGE_LABELS[r.stage]}
                          {r.group_letter ? ` ${r.group_letter}` : ""}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            {r.home} vs {r.away}
                          </div>
                          <div className="text-muted-foreground">
                            #{r.fifa_match_number} ·{" "}
                            {formatMatchDateTime(r.match_datetime)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {r.home_score != null && r.away_score != null
                            ? `${r.home_score} - ${r.away_score}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1",
                              finished &&
                                res === r.predicted_result &&
                                "text-primary",
                              finished &&
                                res !== r.predicted_result &&
                                "text-destructive",
                            )}
                          >
                            {PREDICTION_LABELS[r.predicted_result]}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {finished ? (
                            r.points_awarded > 0 ? (
                              <Badge variant="success">
                                +{r.points_awarded}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">0</Badge>
                            )
                          ) : (
                            <Badge variant="muted">—</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
