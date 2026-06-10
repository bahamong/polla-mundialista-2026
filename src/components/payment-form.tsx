"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { submitPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

export function PaymentForm({
  defaultAmount,
  currency = "COP",
}: {
  defaultAmount: number;
  currency?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function action(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await submitPayment(formData);
      if (res.error) {
        setOk(false);
        setMessage(res.error);
      } else {
        setOk(true);
        setMessage(
          "¡Pago registrado! El administrador revisará y aprobará tu cupo.",
        );
        router.refresh();
      }
    });
  }

  return (
    <form action={action} className="space-y-3">
      {/* Monto fijo: no editable por el participante */}
      <input type="hidden" name="amount" value={defaultAmount} />
      <input type="hidden" name="payment_method" value="Nequi / Bre-B" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label>Monto</Label>
          <p className="text-2xl font-extrabold">
            {formatCurrency(defaultAmount, currency)}
          </p>
        </div>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Registrar pago
        </Button>
      </div>
      {message && (
        <p className={ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {message}
        </p>
      )}
    </form>
  );
}
