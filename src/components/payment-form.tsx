"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { submitPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function PaymentForm({ defaultAmount }: { defaultAmount: number }) {
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="any"
            defaultValue={defaultAmount}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_method">Método de pago</Label>
          <Select id="payment_method" name="payment_method" defaultValue="transferencia">
            <option value="transferencia">Transferencia</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
            <option value="efectivo">Efectivo</option>
            <option value="otro">Otro</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reference">Referencia / comprobante</Label>
        <Input
          id="reference"
          name="reference"
          placeholder="Número de transacción o nota"
        />
      </div>
      {message && (
        <p className={ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {message}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Registrar pago
      </Button>
    </form>
  );
}
