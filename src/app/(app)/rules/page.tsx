import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/constants";
import type { EliminationRule } from "@/lib/types";

export default async function RulesPage() {
  const settings = await getSettings();
  const supabase = await createClient();
  const { data } = await supabase
    .from("elimination_rules")
    .select("*")
    .order("created_at", { ascending: true });
  const rules = (data as EliminationRule[]) ?? [];

  const fee = Number(settings.entry_fee || 0);
  const currency = settings.currency || "COP";
  const pts = settings.points_per_correct || "1";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Reglas de la polla</h1>

      <Card>
        <CardHeader>
          <CardTitle>Puntuación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Aciertas el resultado (gana local, empate o gana visitante):{" "}
            <span className="font-semibold text-foreground">{pts} punto(s)</span>
          </p>
          <p>• No aciertas: 0 puntos.</p>
          <p>• Solo se otorgan puntos cuando el partido está finalizado.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apuestas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Necesitas un cupo aprobado para poder apostar.</p>
          <p>• Las apuestas cierran 1 hora antes de cada partido.</p>
          <p>• Puedes editar tu predicción hasta el cierre.</p>
          <p>• Solo una predicción por partido.</p>
          <p>
            • Las fases de eliminación se habilitan cuando se definen los equipos
            clasificados.
          </p>
        </CardContent>
      </Card>

      {fee > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Costo del cupo:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(fee, currency)}
              </span>
            </p>
            {settings.payment_instructions && (
              <p>{settings.payment_instructions}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Eliminación por fases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Al terminar cada fase, quienes no alcancen el puntaje mínimo quedan
            eliminados (conservan sus puntos e historial).
          </p>
          <div className="space-y-1">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-foreground">{STAGE_LABELS[r.stage]}</span>
                <span className="flex items-center gap-2">
                  <span>mínimo {r.minimum_points} pts</span>
                  {r.active ? (
                    <Badge variant="success">Activa</Badge>
                  ) : (
                    <Badge variant="muted">Inactiva</Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
