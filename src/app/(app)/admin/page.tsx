import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTools } from "@/components/admin/admin-tools";
import { Users, Wallet, CalendarCheck, Trophy } from "lucide-react";

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  filters?: Record<string, string>,
) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filters) {
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  }
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    pendingPayments,
    finishedMatches,
    totalMatches,
  ] = await Promise.all([
    count(supabase, "profiles"),
    count(supabase, "profiles", { status: "active" }),
    count(supabase, "profiles", { status: "pending_payment" }),
    count(supabase, "payments", { status: "pending" }),
    count(supabase, "matches", { status: "finished" }),
    count(supabase, "matches"),
  ]);

  const stats = [
    { icon: Users, label: "Usuarios totales", value: totalUsers },
    { icon: Users, label: "Activos", value: activeUsers },
    { icon: Wallet, label: "Cupos pendientes", value: pendingUsers },
    { icon: Wallet, label: "Pagos por revisar", value: pendingPayments },
    {
      icon: CalendarCheck,
      label: "Partidos finalizados",
      value: `${finishedMatches} / ${totalMatches}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" /> Herramientas del torneo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTools />
        </CardContent>
      </Card>
    </div>
  );
}
