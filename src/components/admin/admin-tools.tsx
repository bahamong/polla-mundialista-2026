"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { recalculateAll } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminTools() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function doRecalc() {
    setMessage(null);
    startTransition(async () => {
      const res = await recalculateAll();
      setMessage(res.error ? `Error: ${res.error}` : res.info ?? "Listo.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Recalcula los puntos de todos los participantes (útil si corriges algún
        resultado). El ranking y los premios se actualizan automáticamente.
      </p>
      <Button
        onClick={doRecalc}
        disabled={isPending}
        variant="secondary"
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Recalcular todos los puntos
      </Button>
      {message && <p className="text-sm text-primary">{message}</p>}
    </div>
  );
}
