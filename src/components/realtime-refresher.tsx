"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Suscribe a cambios en las tablas indicadas y refresca la página
 * (Server Components) cuando ocurren, para ranking/resultados en vivo.
 */
export function RealtimeRefresher({
  tables = ["profiles", "matches"],
}: {
  tables?: string[];
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("pm-realtime");

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh(),
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
