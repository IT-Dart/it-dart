import { supabase } from "./supabaseClient";

// App palette, as RGB triples (matches src/lib/theme.js)
const COL = {
  bg: [15, 22, 35],
  s1: [26, 37, 53],
  s2: [33, 46, 66],
  border: [45, 63, 90],
  text: [241, 245, 249],
  text2: [148, 163, 184],
  mu: [100, 116, 139],
  blue: [37, 99, 235],
  cyan: [56, 189, 248],
  green: [34, 197, 94],
  amber: [245, 158, 11],
  red: [220, 38, 38],
  coral: [251, 113, 133],
  white: [255, 255, 255],
  dart: [1, 1, 112], // #010170 — Farbe des Darts im Trefferbild
};

// Redraws the IT-Dart logo (concentric rings + dart) as vector shapes —
// it's already a target-and-dart mark, reused at large size for the
// plain (non-Prüfungsvorbereitung) badge.
function drawMark(doc, cx, cy, r, { ringOnly = false } = {}) {
  doc.setDrawColor(...COL.blue);
  doc.setFillColor(...COL.s1);
  doc.setLineWidth(r * 0.09);
  doc.circle(cx, cy, r, "FD");

  doc.setDrawColor(...COL.blue);
  doc.setLineWidth(r * 0.05);
  doc.circle(cx, cy, r * 0.64, "S");

  doc.setDrawColor(...COL.cyan);
  doc.circle(cx, cy, r * 0.32, "S");

  doc.setFillColor(...COL.cyan);
  doc.circle(cx, cy, r * 0.14, "F");

  if (!ringOnly) {
    doc.setDrawColor(...COL.blue);
    doc.setLineWidth(r * 0.09);
    doc.line(cx - r * 0.77, cy, cx - r * 0.14, cy);
    doc.setFillColor(...COL.blue);
    doc.triangle(
      cx + r * 0.27, cy - r * 0.27,
      cx + r * 0.27, cy + r * 0.27,
      cx + r * 0.68, cy,
      "F"
    );
  }
}

// The five evaluation zones, in order from best to worst. Each maps to a
// concrete ring band on the dartboard (ring 1 = innermost bullseye ... ring
// 5 = missed the board entirely). minPct is inclusive.
//
// Bounds line up with what's actually reachable: a Lernnachweis can only be
// generated at 50%+, so "Fehlwurf" (off the board) only ever fires below
// that floor — every real score lands somewhere ON the board.
const ZONES = [
  { minPct: 95, ring: 1, key: "bullseye", label: "Voll ins IT-Bullseye!", color: COL.amber },
  { minPct: 85, ring: 2, key: "hervorragend", label: "Hervorragender Wurf!", color: COL.amber },
  { minPct: 70, ring: 3, key: "gut", label: "Guter Wurf!", color: COL.cyan },
  { minPct: 50, ring: 4, key: "besser", label: "Das geht besser! Du hast den Pfeil in der Hand.", color: COL.blue },
  { minPct: -Infinity, ring: 5, key: "fehlwurf", label: "Fehlwurf! Abweichung im System. Analysiere das Modul erneut, um die Fehlerquelle zu isolieren.", color: COL.coral },
];

function zoneForPercent(pct) {
  return ZONES.find((z) => pct >= z.minPct);
}

// Deterministic landing angle so the same score always lands in the same
// spot (reproducible PDF) without every result clustering on one side.
function seededAngleDeg(score, total) {
  return (score * 53 + total * 17 + 40) % 360;
}

// A single, precise dart — one shaft, one tip — matching the shape of the
// IT-Dart logo mark exactly (no back-fins, so it can never read as an
// arrow with two points). Scales with `len`.
function drawPreciseDart(doc, landX, landY, dirX, dirY, len) {
  const perpX = -dirY, perpY = dirX;
  const shaftStart = { x: landX + len * 0.42 * dirX, y: landY + len * 0.42 * dirY };
  const shaftEnd = { x: landX + len * dirX, y: landY + len * dirY };

  doc.setDrawColor(...COL.dart);
  doc.setLineWidth(len * 0.1);
  doc.line(shaftStart.x, shaftStart.y, shaftEnd.x, shaftEnd.y);

  const tipLen = len * 0.34, tipWide = len * 0.16;
  doc.setFillColor(...COL.dart);
  doc.triangle(
    landX + tipLen * dirX + perpX * tipWide, landY + tipLen * dirY + perpY * tipWide,
    landX + tipLen * dirX - perpX * tipWide, landY + tipLen * dirY - perpY * tipWide,
    landX, landY,
    "F"
  );
}

// Blend two RGB triples — used to fake a soft glow without relying on PDF
// alpha/transparency support, which is inconsistent across viewers.
function blendRGB(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

// Draws the dartboard (three colour-coded ring bands, matching the five
// evaluation zones — the top two share the "orange" bullseye band) plus a
// backboard wide enough to show a dart that missed the board entirely
// (zone 5, <50% — effectively unreachable since a Lernnachweis needs 50%+
// to generate at all, but kept as a sane fallback). The dart always lands
// somewhere — distance from the bullseye is driven directly by the score.
// A perfect score gets a soft glow around the bullseye instead of a flat fill.
function drawDartboardTarget(doc, cx, cy, r, percent, score, total, zone) {
  const R2 = r * 0.4, R2b = r * 0.55, R3 = r * 0.7, R4 = r;
  const bb = r * 1.6;

  doc.setDrawColor(...COL.border);
  doc.setFillColor(...COL.s2);
  doc.roundedRect(cx - bb, cy - bb, bb * 2, bb * 2, 6, 6, "FD");

  doc.setFillColor(...COL.blue);
  doc.circle(cx, cy, R4, "F");
  doc.setFillColor(...COL.cyan);
  doc.circle(cx, cy, R3, "F");
  doc.setFillColor(...COL.amber);
  doc.circle(cx, cy, R2b, "F");

  if (zone.ring === 1) {
    // Soft graduated halo around the bullseye for a perfect hit — three
    // nested circles blending from the amber ring into full red.
    doc.setFillColor(...blendRGB(COL.amber, COL.red, 0.35));
    doc.circle(cx, cy, R2 * 1.35, "F");
    doc.setFillColor(...blendRGB(COL.amber, COL.red, 0.7));
    doc.circle(cx, cy, R2 * 1.15, "F");
  }
  doc.setFillColor(...COL.red);
  doc.circle(cx, cy, R2, "F");

  doc.setDrawColor(...COL.border);
  doc.setLineWidth(r * 0.045);
  doc.circle(cx, cy, R4, "S");

  // Landing radius: find the band for this percent, then interpolate
  // within that band by exactly how far into it the score falls.
  const bands = [
    { min: 95, max: 100, inner: 0, outer: R2 * 0.6 },
    { min: 85, max: 95, inner: R2 * 0.6, outer: R2 },
    { min: 70, max: 85, inner: R2, outer: R3 },
    { min: 50, max: 70, inner: R3, outer: R4 },
    { min: 0, max: 50, inner: R4 * 1.08, outer: R4 * 1.55 },
  ];
  const band = bands.find((b) => percent >= b.min && (percent < b.max || b.max === 100)) || bands[bands.length - 1];
  const frac = Math.min(1, Math.max(0, (percent - band.min) / (band.max - band.min)));
  const landR = band.outer - (band.outer - band.inner) * frac;

  const angle = (seededAngleDeg(score, total) * Math.PI) / 180;
  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  const landX = cx + landR * dirX, landY = cy + landR * dirY;

  drawPreciseDart(doc, landX, landY, dirX, dirY, r * 0.75); // 150% der bisherigen Größe (war r * 0.5)
}

// Small vector target icon (a static version of the dartboard, no dart) —
// used as the "star rating" substitute: filled = achieved, muted = not.
function drawMiniTarget(doc, cx, cy, r, filled) {
  if (filled) {
    doc.setFillColor(...COL.blue);
    doc.circle(cx, cy, r, "F");
    doc.setFillColor(...COL.cyan);
    doc.circle(cx, cy, r * 0.64, "F");
    doc.setFillColor(...COL.red);
    doc.circle(cx, cy, r * 0.3, "F");
  } else {
    doc.setDrawColor(...COL.border);
    doc.setFillColor(...COL.s2);
    doc.setLineWidth(r * 0.14);
    doc.circle(cx, cy, r, "FD");
    doc.circle(cx, cy, r * 0.64, "S");
    doc.circle(cx, cy, r * 0.3, "S");
  }
}

function drawRatingRow(doc, x, y, r, filledCount, totalCount) {
  const spacing = r * 2.6;
  for (let i = 0; i < totalCount; i++) {
    drawMiniTarget(doc, x + r + i * spacing, y, r, i < filledCount);
  }
}

/**
 * Generates and downloads the Lernnachweis PDF, and logs it to Supabase.
 * @param {object} p
 * @param {object} p.user - Supabase auth user (needs .email, .id)
 * @param {"modul"|"pruefung"} p.kind
 * @param {string} p.title - module or exam name shown on the proof
 * @param {number} p.score
 * @param {number} p.total
 * @param {{name:string,correct:number,total:number}[]} p.topics
 * @param {Date} [p.startedAt] - when the attempt began, for the Verlauf view
 * @param {Date} [p.finishedAt] - when it ended; defaults to now
 * @param {boolean} [p.skipLog] - true when re-downloading a past Lernnachweis,
 *   so it isn't logged to Supabase a second time
 */
/**
 * Logs a completed quiz attempt to Supabase without generating a PDF —
 * used so trainers/the Statistik view see every finished attempt, not
 * only the ones a user chose to download a Lernnachweis PDF for.
 */
export function logLernnachweis({ user, kind, title, score, total, topics, startedAt, finishedAt }) {
  if (!user) return;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const zone = zoneForPercent(percent);
  return supabase.from("lernnachweise").insert({
    user_id: user.id,
    kind,
    title,
    score,
    total,
    percent,
    badge: zone.key,
    topics,
    started_at: startedAt ? new Date(startedAt).toISOString() : null,
    finished_at: (finishedAt ? new Date(finishedAt) : new Date()).toISOString(),
  });
}

export async function generateLernnachweis({ user, kind, title, score, total, topics, startedAt, finishedAt, skipLog = false }) {
  const { jsPDF } = await import("jspdf");
  const topicsArr = Array.isArray(topics) ? topics : [];

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const zone = zoneForPercent(percent);
  const now = new Date();
  const dateStr = `${now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}, ${now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;

  // Background
  doc.setFillColor(...COL.bg);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...COL.blue);
  doc.rect(0, 0, 4, H, "F");
  doc.setFillColor(...COL.cyan);
  doc.rect(4, 0, 1, H, "F");

  // Header
  drawMark(doc, 26, 26, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COL.text);
  doc.text("IT-Dart", 40, 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.cyan);
  doc.text("Bleib am Dart!", 40, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...COL.text);
  doc.text("Lernnachweis", 20, 55);

  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.4);
  doc.line(20, 62, W - 20, 62);

  // Left column: details + rating row + score + zone caption + topics
  const leftX = 20;
  let y = 78;

  const row = (label, value) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COL.text2);
    doc.text(label.toUpperCase(), leftX, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COL.text);
    doc.text(String(value), leftX, y + 5);
    y += 11;
  };

  row("Name / Konto", user?.email || "Unbekannt");
  row("Bereich", title);
  row("Datum", dateStr);

  // Rating row — 5 mini targets standing in for a star rating, filled
  // count driven by which of the 5 evaluation zones the score landed in.
  y += 3;
  const filledCount = 6 - zone.ring;
  drawRatingRow(doc, leftX, y, 3.2, filledCount, 5);
  y += 9;

  // Score block
  doc.setDrawColor(...COL.border);
  doc.setFillColor(...COL.s1);
  doc.roundedRect(leftX, y, 110, 26, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...zone.color);
  doc.text(`${percent}%`, leftX + 10, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COL.text2);
  doc.text(`${score} von ${total} richtig`, leftX + 52, y + 17);
  y += 31;

  // Zone caption — always shown, for every score range
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...zone.color);
  const capLines = doc.splitTextToSize(zone.label, 115);
  doc.text(capLines, leftX, y);
  y += capLines.length * 3.9 + 4;

  // Topic stats — row height shrinks to fit however many topics there are,
  // so it never runs into the footer, even for a full 7-category exam with
  // a two-line caption above it.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.text2);
  doc.text("THEMENSTATISTIK", leftX, y);
  y += 5;
  const maxTopicsY = H - 15;
  const rowH = Math.max(3, Math.min(11, (maxTopicsY - y) / Math.max(1, topicsArr.length)));
  const barH = rowH < 5 ? 1.1 : rowH < 7 ? 1.4 : rowH < 9 ? 1.6 : 2.2;
  const rowFont = rowH < 5 ? 6.5 : rowH < 7 ? 7.5 : rowH < 9 ? 8.5 : 10;
  const textOff = Math.min(4, rowH * 0.5);
  const barOff = Math.min(6, rowH * 0.78);
  topicsArr.forEach((t) => {
    const tPct = t.total > 0 ? t.correct / t.total : 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(rowFont);
    doc.setTextColor(...COL.text);
    doc.text(t.name, leftX, y + textOff);
    doc.setTextColor(...COL.text2);
    doc.text(`${t.correct}/${t.total}`, leftX + 92, y + textOff, { align: "right" });
    doc.setFillColor(...COL.s2);
    doc.roundedRect(leftX, y + barOff, 92, barH, 1, 1, "F");
    doc.setFillColor(tPct >= 0.8 ? COL.green[0] : COL.cyan[0], tPct >= 0.8 ? COL.green[1] : COL.cyan[1], tPct >= 0.8 ? COL.green[2] : COL.cyan[2]);
    doc.roundedRect(leftX, y + barOff, Math.max(2, 92 * tPct), barH, 1, 1, "F");
    y += rowH;
  });

  // Right column: die Dartscheibe, auf der der Pfeil passend zum
  // Ergebnis landet — für jeden Lernnachweis, nicht nur die großen
  // Prüfungssimulationen.
  const badgeCx = 220, badgeCy = 125;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.text2);
  doc.text("TREFFERBILD", badgeCx, badgeCy - 56, { align: "center" });
  drawDartboardTarget(doc, badgeCx, badgeCy, 30, percent, score, total, zone);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COL.mu);
  doc.text(
    "Kein offizielles Zertifikat — Lernnachweis zur eigenen Lernkontrolle, erstellt mit IT-Dart.",
    leftX,
    H - 9
  );

  const fileSafeTitle = title.replace(/[^a-z0-9äöüß]+/gi, "_").slice(0, 40);
  doc.save(`IT-Dart-Lernnachweis-${fileSafeTitle}.pdf`);

  if (!skipLog) {
    logLernnachweis({ user, kind, title, score, total, topics, startedAt, finishedAt });
  }
}
