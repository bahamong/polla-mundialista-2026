import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getPrizeInfo } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserStatusBadge } from "@/components/status-badges";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { cn, formatCurrency, rankActive } from "@/lib/utils";
import { Trophy, Coins } from "lucide-react";
import type { LeaderboardRow } from "@/lib/types";

export default async function LeaderboardPage() {
  const profile = (await getCurrentProfile())!;
  const prize = await getPrizeInfo();
  const supabase = await createClient();

  const { data } = await supabase.rpc("pm_leaderboard");
  const rows = rankActive((data as LeaderboardRow[]) ?? []);

  const podium = [
    { label: "1° lugar", color: "text-amber-400", amount: prize.prizes[0], pct: prize.pct[0] },
    { label: "2° lugar", color: "text-zinc-300", amount: prize.prizes[1], pct: prize.pct[1] },
    { label: "3° lugar", color: "text-amber-700", amount: prize.prizes[2], pct: prize.pct[2] },
  ].filter((p) => p.pct > 0);

  return (
    <div className="space-y-6">
      <RealtimeRefresher tables={["profiles"]} />
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Tabla de clasificación</h1>
      </div>

      {/* Premio en juego */}
      <Card className="border-primary/30">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
              <Coins className="h-4 w-4" /> Premio en juego
            </span>
            <span className="text-2xl font-extrabold">
              {formatCurrency(prize.pool, prize.currency)}
            </span>
          </div>
          <div
            className={cn(
              "grid gap-3",
              podium.length === 1
                ? "grid-cols-1"
                : podium.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3",
            )}
          >
            {podium.map((p) => (
              <div
                key={p.label}
                className="rounded-lg bg-secondary/40 p-3 text-center"
              >
                <p className={cn("text-xs font-semibold", p.color)}>
                  {p.label} · {p.pct}%
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-400">
                  {formatCurrency(p.amount, prize.currency)}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {prize.participants}{" "}
            {prize.participants === 1 ? "participante" : "participantes"} ·{" "}
            {formatCurrency(prize.perPerson, prize.currency)} de cada cupo van al
            premio. Los montos se actualizan con cada inscripción y según la
            posición actual.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-center">Pts</TableHead>
                <TableHead className="hidden text-center sm:table-cell">
                  Jugados
                </TableHead>
                <TableHead className="hidden text-center sm:table-cell">
                  Aciertos
                </TableHead>
                <TableHead className="text-right">Premio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Aún no hay participantes en el ranking.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isMe = row.user_id === profile.user_id;
                  const reward =
                    row.position >= 1 &&
                    row.position <= 3 &&
                    prize.pool > 0 &&
                    prize.pct[row.position - 1] > 0
                      ? prize.prizes[row.position - 1]
                      : null;
                  return (
                    <TableRow
                      key={row.user_id}
                      className={cn(isMe && "bg-primary/10")}
                    >
                      <TableCell className="font-bold">
                        {row.position <= 3 ? (
                          <span
                            className={cn(
                              row.position === 1 && "text-amber-400",
                              row.position === 2 && "text-zinc-300",
                              row.position === 3 && "text-amber-700",
                            )}
                          >
                            {row.position}
                          </span>
                        ) : (
                          row.position
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.full_name ?? "Participante"}
                        {isMe && (
                          <span className="ml-2 text-xs text-primary">(tú)</span>
                        )}
                        <div className="sm:hidden">
                          <UserStatusBadge status={row.status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {row.total_points}
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        {row.matches_played}
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        {row.hits}
                      </TableCell>
                      <TableCell className="text-right">
                        {reward != null ? (
                          <span className="font-semibold text-emerald-400">
                            {formatCurrency(reward, prize.currency)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
