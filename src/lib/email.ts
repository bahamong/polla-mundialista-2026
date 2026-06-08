import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getReportData } from "@/lib/report-data";
import { buildReportWorkbook } from "@/lib/reports";
import { STAGE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { MatchStage } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = SupabaseClient<any, "public", any>;

interface Recipient {
  email: string;
  full_name: string | null;
}

/**
 * Envía por correo el reporte (Excel adjunto) de una fase a cada participante.
 * Si RESEND_API_KEY no está configurada, no hace nada (devuelve sent: 0).
 */
export async function sendPhaseReportEmails(
  supabase: DB,
  stage: MatchStage,
): Promise<{ sent: number; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL;
  if (!apiKey || !from) return { sent: 0, skipped: true };

  // Destinatarios: participantes con cupo aprobado y correo válido
  const { data: profs } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("role", "participant")
    .eq("status", "active");
  const recipients = ((profs as Recipient[]) ?? []).filter(
    (p) => p.email && /\S+@\S+\.\S+/.test(p.email),
  );
  if (recipients.length === 0) return { sent: 0 };

  const data = await getReportData(supabase, stage);
  const stageLabel = STAGE_LABELS[stage];
  const buf = await buildReportWorkbook({
    title: "Polla Mundialista FIFA 2026",
    subtitle: `Reporte: ${stageLabel}`,
    rows: data.rows,
    standings: data.standings,
    currency: data.currency,
    winnerPrize: data.winnerPrize,
  });
  const base64 = buf.toString("base64");
  const filename = `polla2026-reporte-${stage}.xlsx`;

  const top3 = data.standings
    .slice(0, 3)
    .map(
      (s) =>
        `<tr><td style="padding:4px 10px">${s.position}</td><td style="padding:4px 10px">${
          s.full_name ?? "Participante"
        }</td><td style="padding:4px 10px;font-weight:bold">${s.total_points} pts</td></tr>`,
    )
    .join("");

  const leader = data.standings[0];
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
    <div style="background:#0f1a2b;color:#fff;padding:20px;border-radius:12px 12px 0 0">
      <h2 style="margin:0">🏆 Polla Mundialista FIFA 2026</h2>
      <p style="margin:6px 0 0;color:#86efac">Reporte de fase: <b>${stageLabel}</b></p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 12px 12px">
      <p>¡Hola! Terminó la fase <b>${stageLabel}</b>. Adjuntamos el reporte en Excel
      con el detalle de los puntos de <b>todos</b> los participantes, para total transparencia.</p>
      <h3 style="margin-bottom:6px">Top 3 actual</h3>
      <table style="border-collapse:collapse;width:100%;background:#f8fafc;border-radius:8px">
        <tr style="background:#16a34a;color:#fff">
          <td style="padding:6px 10px">#</td><td style="padding:6px 10px">Participante</td><td style="padding:6px 10px">Puntos</td>
        </tr>
        ${top3}
      </table>
      ${
        leader
          ? `<p style="margin-top:14px">Si el torneo terminara hoy, <b>${
              leader.full_name ?? "el líder"
            }</b> se llevaría el premio de <b>${formatCurrency(
              data.winnerPrize,
              data.currency,
            )}</b>.</p>`
          : ""
      }
      <p style="color:#64748b;font-size:13px;margin-top:16px">Abre el Excel adjunto para verificar cada predicción y puntaje. Este correo es automático.</p>
    </div>
  </div>`;

  const resend = new Resend(apiKey);
  let sent = 0;
  let lastError: string | undefined;

  for (const r of recipients) {
    try {
      const { error } = await resend.emails.send({
        from,
        to: r.email,
        subject: `Reporte ${stageLabel} — Polla Mundialista 2026`,
        html,
        attachments: [{ filename, content: base64 }],
      });
      if (error) lastError = error.message;
      else sent += 1;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return { sent, error: lastError };
}

/**
 * Si todos los partidos de una fase quedaron finalizados y aún no se ha
 * notificado, envía el reporte por correo y marca la fase como notificada.
 */
export async function maybeNotifyPhaseComplete(
  supabase: DB,
  stage: MatchStage,
): Promise<{ notified: boolean; sent?: number; skipped?: boolean }> {
  const { count: total } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("stage", stage);
  const { count: finished } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("stage", stage)
    .eq("status", "finished");

  if (!total || (finished ?? 0) < total) return { notified: false };

  const flagKey = `phase_notified_${stage}`;
  const { data: flag } = await supabase
    .from("tournament_settings")
    .select("value")
    .eq("key", flagKey)
    .maybeSingle();
  if ((flag as { value?: string } | null)?.value === "true")
    return { notified: false };

  const res = await sendPhaseReportEmails(supabase, stage);

  // Marca como notificada solo si realmente se envió al menos un correo.
  if (res.sent > 0) {
    await supabase
      .from("tournament_settings")
      .upsert(
        { key: flagKey, value: "true", updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
  }
  return { notified: res.sent > 0, sent: res.sent, skipped: res.skipped };
}
