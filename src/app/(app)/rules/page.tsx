import { getSettings, getPrizeInfo } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function RulesPage() {
  const settings = await getSettings();
  const prize = await getPrizeInfo();

  const fee = prize.entryFee;
  const currency = prize.currency;
  const pts = settings.points_per_correct || "1";

  const podium = [
    { label: "1° lugar", medal: "🥇", color: "text-amber-400", amount: prize.prizes[0], pct: prize.pct[0] },
    { label: "2° lugar", medal: "🥈", color: "text-zinc-300", amount: prize.prizes[1], pct: prize.pct[1] },
    { label: "3° lugar", medal: "🥉", color: "text-amber-700", amount: prize.prizes[2], pct: prize.pct[2] },
  ].filter((p) => p.pct > 0);

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
            • <span className="font-semibold text-foreground">Todos juegan
            todos los partidos</span> hasta la final: nadie queda eliminado.
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Premios 🏆</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {podium.length <= 1
              ? "El primer lugar de la tabla se lleva todo el premio acumulado al final del torneo:"
              : "El premio acumulado se reparte entre los primeros de la tabla al final del torneo:"}
          </p>
          <div className="space-y-1">
            {podium.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className={`font-medium ${p.color}`}>
                  {p.medal} {p.label}
                </span>
                <span>
                  {p.pct}% ·{" "}
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(p.amount, currency)}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p>
            Premio total en juego:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(prize.pool, currency)}
            </span>{" "}
            ({prize.participants}{" "}
            {prize.participants === 1 ? "participante" : "participantes"}). Cada
            cupo aporta {formatCurrency(prize.perPerson, currency)} al premio
            (la diferencia cubre el costo de la página). Los montos cambian
            dinámicamente con cada inscripción.
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
    </div>
  );
}
