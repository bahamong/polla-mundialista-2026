"use client";

import { useState, useTransition } from "react";
import { savePrediction } from "@/lib/actions/predictions";
import { cn } from "@/lib/utils";
import { Lock, Check, Loader2 } from "lucide-react";
import type { PredictionResult } from "@/lib/types";

export function PredictionForm({
  matchId,
  homeName,
  awayName,
  current,
  canBet,
  reason,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  current: PredictionResult | null;
  canBet: boolean;
  reason?: string;
}) {
  const [selected, setSelected] = useState<PredictionResult | null>(current);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const options: { value: PredictionResult; label: string }[] = [
    { value: "home", label: homeName },
    { value: "draw", label: "Empate" },
    { value: "away", label: awayName },
  ];

  function choose(value: PredictionResult) {
    if (!canBet || isPending) return;
    const prev = selected;
    setSelected(value);
    setMessage(null);
    startTransition(async () => {
      const res = await savePrediction(matchId, value);
      if (res.error) {
        setSelected(prev);
        setOk(false);
        setMessage(res.error);
      } else {
        setOk(true);
        setMessage("¡Predicción guardada!");
      }
    });
  }

  if (!canBet) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {reason ?? "Las apuestas para este partido están cerradas."}
        </div>
        {current && (
          <p className="mt-1">
            Tu predicción:{" "}
            <span className="font-semibold text-foreground">
              {options.find((o) => o.value === current)?.label}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => choose(opt.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-center text-sm font-medium transition-all",
              selected === opt.value
                ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {selected === opt.value && isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : selected === opt.value ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
            <span className="line-clamp-1">{opt.label}</span>
          </button>
        ))}
      </div>
      {message && (
        <p
          className={cn(
            "text-xs",
            ok ? "text-primary" : "text-destructive",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
