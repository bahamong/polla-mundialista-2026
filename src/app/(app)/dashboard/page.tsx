import Link from "next/link";
import {
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Wallet,
  Coins,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSettings, getPrizeInfo } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserStatusBadge, PaymentStatusBadge } from "@/components/status-badges";
import { PaymentForm } from "@/components/payment-form";
import { MatchCard } from "@/components/match-card";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import type {
  LeaderboardRow,
  MatchWithTeams,
  Payment,
  Prediction,
} from "@/lib/types";

export default async function DashboardPage() {
  const profile = (await getCurrentProfile())!;
  const settings = await getSettings();
  const prize = await getPrizeInfo();
  const supabase = await createClient();

  const fee = Number(settings.entry_fee || 0);
  const currency = prize.currency;

  // posición en el ranking
  const { data: lbRow } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("user_id", profile.user_id)
    .maybeSingle();
  const rank = (lbRow as LeaderboardRow | null)?.position;

  // pagos del usuario
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });
  const payments = (paymentsData as Payment[]) ?? [];

  // próximos partidos abiertos
  const nowIso = new Date().toISOString();
  const { data: matchesData } = await supabase
    .from("matches")
    .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
    .eq("status", "scheduled")
    .gt("bet_closes_at", nowIso)
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null)
    .order("match_datetime", { ascending: true })
    .limit(4);
  const matches = (matchesData as unknown as MatchWithTeams[]) ?? [];

  // predicciones del usuario para esos partidos
  const matchIds = matches.map((m) => m.id);
  const { data: predsData } = matchIds.length
    ? await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", profile.user_id)
        .in("match_id", matchIds)
    : { data: [] };
  const predMap = new Map<string, Prediction>();
  (predsData as Prediction[] | null)?.forEach((p) =>
    predMap.set(p.match_id, p),
  );

  const isActive = profile.status === "active";

  return (
    <div className="space-y-6">
      <RealtimeRefresher tables={["profiles", "matches"]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Hola, {profile.full_name || "participante"} 👋
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <UserStatusBadge status={profile.status} />
          </div>
        </div>
        <Link href="/matches">
          <Button className="gap-2">
            Ir a apostar <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Premio en juego */}
      <Card className="hover-lift border-primary/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              <Coins className="h-4 w-4" /> Premio en juego
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {formatCurrency(prize.pool, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {prize.participants}{" "}
              {prize.participants === 1 ? "participante" : "participantes"} ·{" "}
              {formatCurrency(prize.perPerson, currency)} de cada cupo
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-center">
            {[
              { l: "1°", c: "text-amber-400", a: prize.prizes[0], p: prize.pct[0] },
              { l: "2°", c: "text-zinc-300", a: prize.prizes[1], p: prize.pct[1] },
              { l: "3°", c: "text-amber-700", a: prize.prizes[2], p: prize.pct[2] },
            ]
              .filter((x) => x.p > 0)
              .map((x) => (
                <div key={x.l} className="rounded-lg bg-secondary/40 px-3 py-2">
                  <p className={`text-xs font-semibold ${x.c}`}>
                    {x.l} · {x.p}%
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-emerald-400">
                    {formatCurrency(x.a, currency)}
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Estado del cupo */}
      {profile.status === "pending_payment" && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Tu cupo está pendiente de
              aprobación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cuando el administrador confirme tu pago podrás participar.
              {settings.payment_instructions
                ? ` ${settings.payment_instructions}`
                : ""}
            </p>
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4 text-primary" /> Registrar mi pago
              </div>
              <PaymentForm defaultAmount={fee} />
            </div>
            {payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Mis pagos registrados
                </p>
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {formatCurrency(Number(p.amount), currency)} ·{" "}
                      {p.payment_method}
                    </span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {profile.status === "eliminated" && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <XCircle className="h-5 w-5 text-destructive" />
            Fuiste eliminado por no alcanzar el puntaje mínimo. Conservas tus
            puntos e historial, pero ya no puedes apostar en las siguientes
            fases.
          </CardContent>
        </Card>
      )}

      {isActive && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            ¡Tu cupo está activo! Ya puedes registrar tus predicciones.
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Trophy className="h-5 w-5 text-primary" />}
          label="Puntos totales"
          value={profile.total_points}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-accent" />}
          label="Aciertos / Jugados"
          value={`${profile.hits} / ${profile.matches_played}`}
        />
        <StatCard
          icon={<Badge variant="outline">#</Badge>}
          label="Posición"
          value={rank ? `#${rank}` : "—"}
        />
      </div>

      {/* Próximos partidos */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximos partidos abiertos</h2>
          <Link href="/matches" className="text-sm text-primary">
            Ver todos
          </Link>
        </div>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay partidos abiertos para apostar en este momento.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predMap.get(m.id)}
                userActive={isActive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="hover-lift">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
