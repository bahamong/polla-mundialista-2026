"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateSetting } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const FIELDS: {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "boolean";
}[] = [
  { key: "tournament_name", label: "Nombre del torneo" },
  { key: "entry_fee", label: "Costo del cupo", type: "number" },
  {
    key: "platform_fee",
    label: "Comisión de la página por cupo (se resta del premio)",
    type: "number",
  },
  { key: "prize_pct_1", label: "Premio 1° lugar (%)", type: "number" },
  { key: "prize_pct_2", label: "Premio 2° lugar (%)", type: "number" },
  { key: "prize_pct_3", label: "Premio 3° lugar (%)", type: "number" },
  { key: "currency", label: "Moneda (ej. COP, USD)" },
  { key: "points_per_correct", label: "Puntos por acierto", type: "number" },
  { key: "registration_open", label: "Registro abierto", type: "boolean" },
  { key: "public_leaderboard", label: "Ranking público", type: "boolean" },
  {
    key: "payment_instructions",
    label: "Instrucciones de pago",
    type: "textarea",
  },
];

function Field({
  field,
  initial,
}: {
  field: (typeof FIELDS)[number];
  initial: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(v?: string) {
    const toSave = v ?? value;
    startTransition(async () => {
      await updateSetting(field.key, toSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <Label>{field.label}</Label>
      <div className="flex items-start gap-2">
        {field.type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : field.type === "boolean" ? (
          <select
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              save(e.target.value);
            }}
            className="flex h-10 w-40 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        ) : (
          <Input
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {field.type !== "boolean" && (
          <Button
            variant="secondary"
            onClick={() => save()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {saved && <span className="text-xs text-primary">Guardado ✓</span>}
    </div>
  );
}

export function SettingsManager({
  settings,
}: {
  settings: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      {FIELDS.map((f) => (
        <Field key={f.key} field={f} initial={settings[f.key] ?? ""} />
      ))}
    </div>
  );
}
