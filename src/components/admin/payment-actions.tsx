"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { reviewPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      await reviewPayment(paymentId, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Button
        size="sm"
        variant="success"
        className="gap-1"
        disabled={isPending}
        onClick={() => decide("approved")}
      >
        <Check className="h-4 w-4" /> Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1"
        disabled={isPending}
        onClick={() => decide("rejected")}
      >
        <X className="h-4 w-4" /> Rechazar
      </Button>
    </div>
  );
}
