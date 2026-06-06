import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
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
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/lib/types";

export default async function LeaderboardPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("position", { ascending: true });
  const rows = (data as LeaderboardRow[]) ?? [];

  return (
    <div className="space-y-6">
      <RealtimeRefresher tables={["profiles"]} />
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Tabla de clasificación</h1>
      </div>

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
                <TableHead className="text-center">Estado</TableHead>
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
                      <TableCell className="text-center">
                        <UserStatusBadge status={row.status} />
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
