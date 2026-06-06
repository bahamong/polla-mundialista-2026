"use client";

import { useEffect, useState } from "react";
import { Clock, Lock } from "lucide-react";

/** Cuenta regresiva hasta el cierre de apuestas (bet_closes_at). */
export function Countdown({ closesAt }: { closesAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(closesAt).getTime() - now;

  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <Lock className="h-3 w-3" /> Apuestas cerradas
      </span>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const label =
    days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
      <Clock className="h-3 w-3" /> Cierra en {label}
    </span>
  );
}
