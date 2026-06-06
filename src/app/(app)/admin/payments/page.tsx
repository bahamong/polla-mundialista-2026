import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/status-badges";
import { PaymentActions } from "@/components/admin/payment-actions";
import { formatCurrency } from "@/lib/utils";
import type { Payment, Profile } from "@/lib/types";

type PaymentWithProfile = Payment & { profile: Profile | null };

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency || "COP";

  const { data } = await supabase
    .from("payments")
    .select("*, profile:user_id(full_name, email)")
    .order("created_at", { ascending: false });
  const payments = (data as unknown as PaymentWithProfile[]) ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participante</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay pagos registrados.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.profile?.full_name ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {p.profile?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(Number(p.amount), currency)}
                  </TableCell>
                  <TableCell>{p.payment_method ?? "—"}</TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {p.reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(p.created_at), "d MMM HH:mm", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "pending" ? (
                      <PaymentActions paymentId={p.id} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
