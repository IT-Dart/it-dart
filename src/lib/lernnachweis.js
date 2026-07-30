import { supabase } from "./supabaseClient";
import bullseye100Img from "../assets/lernnachweis-bullseye-100.jpg";

// App palette, as RGB triples (matches src/lib/theme.js). Exported so other
// jsPDF-based generators (e.g. src/lib/e2eReport.js) reuse the same palette
// instead of duplicating it.
export const COL = {
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

export function zoneForPercent(pct) {
  return ZONES.find((z) => pct >= z.minPct);
}

// Deterministic landing angle so the same score always lands in the same
// spot (reproducible PDF) without every result clustering on one side.
export function seededAngleDeg(score, total) {
  return (score * 53 + total * 17 + 40) % 360;
}

// A single, precise dart — one shaft, one tip — matching the shape of the
// IT-Dart logo mark exactly (no back-fins, so it can never read as an
// arrow with two points). Scales with `len`.
function drawPreciseDart(doc, landX, landY, dirX, dirY, len) {
  const perpX = -dirY, perpY = dirX;
  const shaftStart = { x: landX + len * 0.42 * dirX, y: landY + len * 0.42 * dirY };
  const shaftEnd = { x: landX + len * dirX, y: landY + len * dirY };

  // Selbe Farbe wie der Pfeil im IT-Dart-Logo (drawMark, COL.blue) -- der
  // Pfeil im Trefferbild soll klar als "unser" Dart erkennbar sein, nicht
  // als generische dunkle Form. Nur ein duenner heller Kontur-Saum (nicht
  // die dicke Halo aus der vorherigen, viel dunkleren Dart-Farbe -- die
  // hätte hier das Blau optisch komplett überdeckt), reicht aber, damit er
  // auch auf dem aehnlich blauen Aussenring klar erkennbar bleibt.
  doc.setDrawColor(...COL.text);
  doc.setLineWidth(len * 0.11);
  doc.line(shaftStart.x, shaftStart.y, shaftEnd.x, shaftEnd.y);

  doc.setDrawColor(...COL.blue);
  doc.setLineWidth(len * 0.09);
  doc.line(shaftStart.x, shaftStart.y, shaftEnd.x, shaftEnd.y);

  const tipLen = len * 0.34, tipWide = len * 0.16;
  doc.setFillColor(...COL.text);
  doc.triangle(
    landX + tipLen * dirX + perpX * (tipWide * 1.12), landY + tipLen * dirY + perpY * (tipWide * 1.12),
    landX + tipLen * dirX - perpX * (tipWide * 1.12), landY + tipLen * dirY - perpY * (tipWide * 1.12),
    landX, landY,
    "F"
  );
  doc.setFillColor(...COL.blue);
  doc.triangle(
    landX + tipLen * dirX + perpX * tipWide, landY + tipLen * dirY + perpY * tipWide,
    landX + tipLen * dirX - perpX * tipWide, landY + tipLen * dirY - perpY * tipWide,
    landX, landY,
    "F"
  );
}

// Blend two RGB triples — used to fake a soft glow without relying on PDF
// alpha/transparency support, which is inconsistent across viewers.
export function blendRGB(a, b, t) {
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
  // Bullseye deutlich kleiner als vorher (war 0.4r/0.55r — auf einem
  // echten Dartboard ist der Bull nur ein kleiner Akzent in der Mitte,
  // kein Drittel der Scheibe). Cyan/Blau übernehmen dafür den Großteil der
  // Fläche, wie beim echten Board die äußeren Scoring-Ringe.
  const R2 = r * 0.16, R2b = r * 0.26, R3 = r * 0.5, R4 = r;
  const bb = r * 1.75;

  // Sanfter Glow hinter der Scheibe -- passend zum Cyan/Blau-Akzentstil der
  // restlichen Plattform (Buttons, Karten, Partikeleffekt auf der
  // Unternehmensseite), statt einer komplett flachen Flaeche.
  doc.setFillColor(...blendRGB(COL.bg, COL.blue, 0.14));
  doc.circle(cx, cy, R4 * 1.24, "F");
  doc.setFillColor(...blendRGB(COL.bg, COL.cyan, 0.12));
  doc.circle(cx, cy, R4 * 1.1, "F");

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

  // Dünne dunkle Trennringe an jeder Zonengrenze -- vorher gingen die
  // Farbbänder konturlos ineinander über und wirkten flach; ein echtes
  // Dartboard hat an jedem Ring einen sichtbaren Draht.
  doc.setDrawColor(...COL.bg);
  doc.setLineWidth(r * 0.018);
  [R2, R2b, R3].forEach((rr) => doc.circle(cx, cy, rr, "S"));

  doc.setDrawColor(...COL.border);
  doc.setLineWidth(r * 0.045);
  doc.circle(cx, cy, R4, "S");
  // Dünner heller Akzentring knapp außerhalb -- derselbe Cyan-Rahmen-Stil
  // wie Karten/Buttons im Rest der Plattform (siehe theme.js).
  doc.setDrawColor(...COL.cyan);
  doc.setLineWidth(r * 0.015);
  doc.circle(cx, cy, R4 * 1.035, "S");

  // Futuristische "Platinen"-Speichen + Knotenpunkte oben auf den
  // Farbbändern -- rein dekorativ, ändert nichts an der Zonen-Farblogik
  // (die bleibt für die Lesbarkeit wichtiger als der Stil), gibt der
  // Scheibe aber den gewünschten technischeren Look statt einer reinen
  // Flachfarben-Fläche.
  const spokeAngles = [15, 60, 105, 150, 195, 240, 285, 330].map((d) => (d * Math.PI) / 180);
  doc.setDrawColor(...blendRGB(COL.s2, COL.cyan, 0.55));
  doc.setLineWidth(r * 0.007);
  spokeAngles.forEach((a, i) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    doc.line(cx + R2b * dx, cy + R2b * dy, cx + R4 * dx, cy + R4 * dy);
    if (i % 2 === 0) {
      // Kurzer Seitenzweig an jeder zweiten Speiche, wie eine Platinenspur.
      const midR = (R3 + R4) / 2;
      const mx = cx + midR * dx, my = cy + midR * dy;
      const perpX = -dy, perpY = dx;
      doc.line(mx, my, mx + perpX * r * 0.06, my + perpY * r * 0.06);
    }
  });
  const nodeR = r * 0.014;
  [R2b, R3, R4].forEach((rr, ringIdx) => {
    const count = 6 + ringIdx * 4;
    doc.setFillColor(...COL.s1);
    doc.setDrawColor(...blendRGB(COL.s2, COL.cyan, 0.6));
    doc.setLineWidth(r * 0.006);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ringIdx * 0.2;
      doc.circle(cx + rr * Math.cos(a), cy + rr * Math.sin(a), nodeR, "FD");
    }
  });

  // Landing radius: find the band for this percent, then interpolate
  // within that band by exactly how far into it the score falls.
  const bands = [
    { min: 95, max: 100, inner: 0, outer: R2 * 0.6 },
    { min: 85, max: 95, inner: R2 * 0.6, outer: R2 },
    { min: 70, max: 85, inner: R2, outer: R3 },
    // outer knapp unter R4 statt exakt auf der Kante -- der Pfeil soll auch
    // beim schwächsten erreichbaren Ergebnis (50%) sichtbar AUF der Scheibe
    // stecken, nicht genau auf der Randlinie balancieren.
    { min: 50, max: 70, inner: R3, outer: R4 * 0.94 },
    { min: 0, max: 50, inner: R4 * 1.08, outer: R4 * 1.55 },
  ];
  const band = bands.find((b) => percent >= b.min && (percent < b.max || b.max === 100)) || bands[bands.length - 1];
  const frac = Math.min(1, Math.max(0, (percent - band.min) / (band.max - band.min)));
  const landR = band.outer - (band.outer - band.inner) * frac;

  const angle = (seededAngleDeg(score, total) * Math.PI) / 180;
  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  const landX = cx + landR * dirX, landY = cy + landR * dirY;

  // Der Schaft verlaeuft vom Landepunkt aus nach aussen (physikalisch
  // korrekt -- die Fluegel zeigen zum Werfer). Landet der Pfeil nah am
  // Scheibenrand, wuerde ein fester Laenge von r*0.75 ueber die Backboard-
  // Kante hinausragen -- deshalb hier auf den tatsaechlich verfuegbaren
  // Platz bis zum Backboard-Rand begrenzen.
  const maxLen = Math.max(r * 0.35, bb - landR - 2);
  const dartLen = Math.min(r * 0.75, maxLen); // 150% der urspruenglichen Groesse (war r * 0.5)
  drawPreciseDart(doc, landX, landY, dirX, dirY, dartLen);
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

// Loads an image (e.g. a Vite-bundled module cover) into a JPEG data URL so
// jsPDF's addImage can embed it — jsPDF needs a data URL/Image/Canvas, not a
// bare asset URL, and the load is async so callers must await it.
function loadImageDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = url;
  });
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
 * @param {string} [p.moduleIconUrl] - bundled module cover image (kind==="modul"
 *   only); shown as a small badge in the header next to the IT-Dart mark
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

export async function generateLernnachweis({ user, kind, title, score, total, topics, startedAt, finishedAt, skipLog = false, moduleIconUrl }) {
  const { jsPDF } = await import("jspdf");
  const topicsArr = Array.isArray(topics) ? topics : [];

  let moduleIconData = null;
  if (kind === "modul" && moduleIconUrl) {
    try {
      moduleIconData = await loadImageDataUrl(moduleIconUrl);
    } catch {
      // Non-critical — certificate still generates without the module badge.
    }
  }

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Bei exakt 100% ein echtes Glow-Bild statt der Vektor-Zielscheibe -- jsPDF
  // kann kein Blur/Glow, ein perfektes Ergebnis verdient trotzdem den
  // "spektakulären" Auftritt (Risse + heller Kern + Schockwelle), den reines
  // Vektor-Zeichnen nicht leisten kann. Fällt bei Ladefehler still auf die
  // Vektor-Version zurück.
  let bullseyeImageData = null;
  if (percent === 100) {
    try {
      bullseyeImageData = await loadImageDataUrl(bullseye100Img);
    } catch {
      // Non-critical — certificate falls back to the vector Trefferbild.
    }
  }

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

  if (moduleIconData) {
    // Groß genug, dass die abgebildete Hardware auf dem Modul-Cover
    // tatsächlich erkennbar bleibt statt nur ein unscharfer Fleck zu sein.
    const iconSize = 28, iconX = W - 20 - iconSize, iconY = 8;
    doc.setDrawColor(...COL.border);
    doc.setFillColor(...COL.s1);
    doc.roundedRect(iconX - 2, iconY - 2, iconSize + 4, iconSize + 4, 2, 2, "FD");
    doc.addImage(moduleIconData, "JPEG", iconX, iconY, iconSize, iconSize, undefined, "FAST");
  }

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
  const badgeCx = 220, badgeCy = 125, badgeR = 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.text2);
  doc.text("TREFFERBILD", badgeCx, badgeCy - 60, { align: "center" });
  if (bullseyeImageData) {
    // Gleiche Fläche wie das Vektor-Backboard (r*1.75), damit die Größe
    // zwischen beiden Darstellungsformen konsistent bleibt. Rahmen im
    // selben abgerundeten Karten-Stil wie der Modul-Icon-Badge oben, Bild
    // etwas eingerückt, damit die runden Ecken des Rahmens sichtbar bleiben
    // (das quadratische Bild hat scharfe Ecken).
    const bb = badgeR * 1.75;
    const imgSize = bb * 2 - 6;
    doc.setDrawColor(...COL.border);
    doc.setFillColor(...COL.s2);
    doc.roundedRect(badgeCx - bb, badgeCy - bb, bb * 2, bb * 2, 6, 6, "FD");
    doc.addImage(bullseyeImageData, "JPEG", badgeCx - imgSize / 2, badgeCy - imgSize / 2, imgSize, imgSize, undefined, "FAST");
  } else {
    drawDartboardTarget(doc, badgeCx, badgeCy, badgeR, percent, score, total, zone);
  }

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
