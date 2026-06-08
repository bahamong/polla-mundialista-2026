import ExcelJS from "exceljs";
import { PREDICTION_LABELS, STAGE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { TransparencyRow } from "@/lib/types";

export interface ReportStanding {
  position: number;
  full_name: string | null;
  total_points: number;
  hits: number;
  matches_played: number;
}

export interface ReportOptions {
  title: string;
  subtitle: string;
  rows: TransparencyRow[];
  standings: ReportStanding[];
  currency: string;
  winnerPrize?: number | null;
}

// Paleta (verde "fútbol" oscuro)
const GREEN = "FF16A34A";
const DARKBG = "FF0F1A2B";
const HEADTXT = "FFFFFFFF";
const STRIPE = "FFEEF6F0";
const GOLD = "FFFFF4CC";
const OKBG = "FFD9F2E3";
const OKTX = "FF166534";
const BADBG = "FFF9D9D9";
const BADTX = "FF991B1B";
const BORDER = "FFD9DEE6";

function thinBorder() {
  const s = { style: "thin" as const, color: { argb: BORDER } };
  return { top: s, left: s, bottom: s, right: s };
}

function realResult(r: TransparencyRow): "home" | "draw" | "away" | null {
  if (r.match_status !== "finished" || r.home_score == null || r.away_score == null)
    return null;
  if (r.home_score > r.away_score) return "home";
  if (r.home_score < r.away_score) return "away";
  return "draw";
}

export async function buildReportWorkbook(opts: ReportOptions): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Polla Mundialista FIFA 2026";
  wb.created = new Date();

  // ============================ HOJA RESUMEN ============================
  const resumen = wb.addWorksheet("Resumen", {
    views: [{ state: "frozen", ySplit: 4 }],
    properties: { defaultRowHeight: 18 },
  });
  resumen.columns = [
    { width: 12 },
    { width: 32 },
    { width: 16 },
    { width: 12 },
    { width: 14 },
    { width: 18 },
  ];

  // Título
  resumen.mergeCells("A1:F1");
  const t1 = resumen.getCell("A1");
  t1.value = opts.title;
  t1.font = { bold: true, size: 18, color: { argb: HEADTXT } };
  t1.alignment = { vertical: "middle", horizontal: "center" };
  t1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARKBG } };
  resumen.getRow(1).height = 32;

  resumen.mergeCells("A2:F2");
  const t2 = resumen.getCell("A2");
  t2.value = opts.subtitle;
  t2.font = { italic: true, size: 11, color: { argb: "FF64748B" } };
  t2.alignment = { horizontal: "center" };

  // Encabezados
  const headerRow = 4;
  const headers = [
    "Posición",
    "Participante",
    "Puntos totales",
    "Aciertos",
    "Jugados",
    "Premio (si gana)",
  ];
  headers.forEach((h, i) => {
    const c = resumen.getCell(headerRow, i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: HEADTXT } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.border = thinBorder();
  });
  resumen.getRow(headerRow).height = 22;

  opts.standings.forEach((s, idx) => {
    const r = headerRow + 1 + idx;
    const vals = [
      s.position,
      s.full_name ?? "Participante",
      s.total_points,
      s.hits,
      s.matches_played,
      s.position === 1 && opts.winnerPrize
        ? formatCurrency(opts.winnerPrize, opts.currency)
        : "",
    ];
    vals.forEach((v, i) => {
      const c = resumen.getCell(r, i + 1);
      c.value = v as ExcelJS.CellValue;
      c.border = thinBorder();
      c.alignment = {
        horizontal: i === 1 ? "left" : "center",
        vertical: "middle",
      };
      if (s.position === 1) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
        c.font = { bold: true };
      } else if (idx % 2 === 1) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: STRIPE } };
      }
    });
  });

  // ============================ HOJA DETALLE ============================
  const detalle = wb.addWorksheet("Detalle de puntos", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 17 },
  });
  detalle.columns = [
    { header: "Participante", key: "p", width: 26 },
    { header: "Fase", key: "f", width: 18 },
    { header: "#", key: "n", width: 6 },
    { header: "Partido", key: "m", width: 36 },
    { header: "Marcador", key: "s", width: 12 },
    { header: "Predicción", key: "pr", width: 16 },
    { header: "¿Acertó?", key: "ok", width: 11 },
    { header: "Puntos", key: "pts", width: 9 },
  ];
  const dHead = detalle.getRow(1);
  dHead.eachCell((c) => {
    c.font = { bold: true, color: { argb: HEADTXT } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.border = thinBorder();
  });
  dHead.height = 22;

  const sorted = [...opts.rows].sort((a, b) => {
    const an = a.fifa_match_number ?? 0;
    const bn = b.fifa_match_number ?? 0;
    if (an !== bn) return an - bn;
    return (a.full_name ?? "").localeCompare(b.full_name ?? "");
  });

  sorted.forEach((r) => {
    const res = realResult(r);
    const finished = r.match_status === "finished";
    const acerto = finished ? (res === r.predicted_result ? "Sí" : "No") : "—";
    const score =
      r.home_score != null && r.away_score != null
        ? `${r.home_score} - ${r.away_score}`
        : "—";
    const row = detalle.addRow({
      p: r.full_name ?? "Participante",
      f: STAGE_LABELS[r.stage] + (r.group_letter ? ` ${r.group_letter}` : ""),
      n: r.fifa_match_number ?? "",
      m: `${r.home ?? "?"} vs ${r.away ?? "?"}`,
      s: score,
      pr: PREDICTION_LABELS[r.predicted_result],
      ok: acerto,
      pts: r.points_awarded,
    });
    row.eachCell((c, col) => {
      c.border = thinBorder();
      c.alignment = {
        vertical: "middle",
        horizontal: col === 1 || col === 4 ? "left" : "center",
      };
    });
    const okCell = row.getCell(7);
    if (acerto === "Sí") {
      okCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: OKBG } };
      okCell.font = { bold: true, color: { argb: OKTX } };
      row.getCell(8).font = { bold: true, color: { argb: OKTX } };
    } else if (acerto === "No") {
      okCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BADBG } };
      okCell.font = { color: { argb: BADTX } };
    }
  });

  // Autofiltro para que cualquiera ordene/filtre y verifique
  detalle.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1 + sorted.length, column: 8 },
  };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
