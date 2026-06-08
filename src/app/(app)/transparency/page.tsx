import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/queries";
import { TransparencyTable } from "@/components/transparency-table";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { ShieldCheck } from "lucide-react";
import type { TransparencyRow } from "@/lib/types";

export default async function TransparencyPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.rpc("pm_transparency");
  const rows = (data as TransparencyRow[]) ?? [];

  return (
    <div className="space-y-6">
      <RealtimeRefresher tables={["matches", "predictions"]} />
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Transparencia</h1>
      </div>
      <TransparencyTable rows={rows} />
    </div>
  );
}
