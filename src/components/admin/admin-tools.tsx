"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, UserMinus } from "lucide-react";
import { recalculateAll, applyElimination } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage } from "@/lib/types";

export function AdminTools() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<MatchStage>("groups");
  const [message, setMessage] = useState<string | null>(null);

  function doRecalc() {
    setMessage(null);
    startTransition(async () => {
      const res = await recalculateAll();
      setMessage(res.error ? `Error: ${res.error}` : res.info ?? "Listo.");
      router.refresh();
    });
  }

  function doEliminate() {
    if (
      !confirm(
        `¿Aplicar eliminación para la fase "${STAGE_LABELS[stage]}"? Los participantes activos por debajo del mínimo quedarán eliminados.`,
      )
    )
      return;
    setMessage(null);
    startTransition(async () => {
      const res = await applyElimination(stage);
      setMessage(res.error ? `Error: ${res.error}` : res.info ?? "Listo.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={doRecalc} disabled={isPending} variant="secondary" className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Recalcular todos los puntos
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Fase a evaluar
          </label>
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
        <Button
          onClick={doEliminate}
          disabled={isPending}
          variant="destructive"
          className="gap-2"
        >
          <UserMinus className="h-4 w-4" />
          Aplicar eliminación
        </Button>
      </div>
      {message && <p className="text-sm text-primary">{message}</p>}
    </div>
  );
}
