import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportData } from "@/lib/report-data";
import { buildReportWorkbook } from "@/lib/reports";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { MatchStage } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const url = new URL(request.url);
  const param = url.searchParams.get("stage") || "all";
  const stage: MatchStage | "all" = (STAGE_ORDER as string[]).includes(param)
    ? (param as MatchStage)
    : "all";

  const data = await getReportData(supabase, stage);
  const stageLabel = stage === "all" ? "General" : STAGE_LABELS[stage];

  const buf = await buildReportWorkbook({
    title: "Polla Mundialista FIFA 2026",
    subtitle: `Reporte: ${stageLabel} · Generado: ${new Date().toLocaleString(
      "es-CO",
      { timeZone: "America/Bogota" },
    )}`,
    rows: data.rows,
    standings: data.standings,
    currency: data.currency,
    winnerPrize: data.winnerPrize,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="polla2026-reporte-${stage}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
