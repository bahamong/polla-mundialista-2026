import { NextResponse } from "next/server";
import { syncLiveScores } from "@/lib/wc-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint para sincronizar marcadores en vivo desde la fuente externa.
 * Lo llama un cron externo (GitHub Actions) cada pocos minutos.
 *
 * Protegido por el secreto SYNC_SECRET, que debe venir en:
 *   - el query param ?key=...   o
 *   - el header  x-sync-key: ...
 *
 * Solo actualiza marcador + estado 'live'. NUNCA finaliza partidos (eso lo
 * confirma el admin), así que es seguro llamarlo con frecuencia.
 */
export async function GET(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "SYNC_SECRET no configurado en el servidor." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const provided =
    url.searchParams.get("key") || request.headers.get("x-sync-key");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const result = await syncLiveScores(secret);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: { "Cache-Control": "no-store" },
  });
}
