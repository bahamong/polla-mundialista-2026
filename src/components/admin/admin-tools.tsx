"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Mail } from "lucide-react";
import { recalculateAll, sendPhaseReportManual } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage } from "@/lib/types";

export function AdminTools() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [stage, setStage] = useState<MatchStage>("groups");

  function doRecalc() {
    setMessage(null);
    startTransition(async () => {
      const res = await recalculateAll();
      setMessage(res.error ? `Error: ${res.error}` : res.info ?? "Listo.");
      router.refresh();
    });
  }

  function doSendReport() {
    setMessage(null);
    startTransition(async () => {
      const res = await sendPhaseReportManual(stage);
      setMessage(res.error ? `Error: ${res.error}` : res.info ?? "Enviado.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Recalcula los puntos de todos los participantes (útil si corriges algún
          resultado). El ranking y los premios se actualizan automáticamente.
        </p>
        <Button
          onClick={doRecalc}
          disabled={isPending}
          variant="secondary"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Recalcular todos los puntos
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          Enviar/reenviar por correo el reporte en Excel de una fase a todos los
          participantes. El envío también ocurre <strong>automáticamente</strong>{" "}
          al cargar el resultado del último partido de cada fase.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fase</label>
            <Select
              value={stage}
              onChange={(e) => setStage(e.target.value as MatchStage)}
              className="w-48"
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={doSendReport} disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Enviar reporte de fase
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-primary">{message}</p>}
    </div>
  );
}
