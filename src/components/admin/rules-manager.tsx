"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { upsertEliminationRule } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { EliminationRule, MatchStage } from "@/lib/types";

function RuleRow({ stage, rule }: { stage: MatchStage; rule?: EliminationRule }) {
  const router = useRouter();
  const [min, setMin] = useState<string>(
    rule?.minimum_points?.toString() ?? "0",
  );
  const [active, setActive] = useState<boolean>(rule?.active ?? false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await upsertEliminationRule(stage, Number(min) || 0, active);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
      <span className="w-40 font-medium">{STAGE_LABELS[stage]}</span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Mínimo pts</label>
        <Input
          type="number"
          min={0}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="h-8 w-20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Activa
      </label>
      <Button size="sm" variant="secondary" onClick={save} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
      {saved && <span className="text-xs text-primary">Guardado ✓</span>}
    </div>
  );
}

export function RulesManager({ rules }: { rules: EliminationRule[] }) {
  const map = new Map(rules.map((r) => [r.stage, r]));
  return (
    <div className="space-y-2">
      {STAGE_ORDER.map((s) => (
        <RuleRow key={s} stage={s} rule={map.get(s)} />
      ))}
    </div>
  );
}
