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
  white: [255, 255, 255],
};

// Redraws the IT-Dart logo (concentric rings + dart) as vector shapes —
// it's already a target-and-dart mark, reused at large size for the
// bullseye badge.
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

function badgeForPercent(pct) {
  if (pct >= 95) return { key: "bullseye", label: "Voll ins IT-Bullseye!" };
  if (pct >= 80) return { key: "auszeichnung", label: "Starker Wurf — mit Auszeichnung" };
  return null;
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
 */
export async function generateLernnachweis({ user, kind, title, score, total, topics }) {
  const { jsPDF } = await import("jspdf");

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const badge = badgeForPercent(percent);
  const dateStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

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
  doc.text("IT-Infrastruktur verstehen. Praxisorientiert lernen.", 40, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...COL.text);
  doc.text("Lernnachweis", 20, 55);

  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.4);
  doc.line(20, 62, W - 20, 62);

  // Left column: details + score + topics
  const leftX = 20;
  let y = 78;

  const row = (label, value) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COL.text2);
    doc.text(label.toUpperCase(), leftX, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COL.text);
    doc.text(String(value), leftX, y + 6);
    y += 16;
  };

  row("Name / Konto", user?.email || "Unbekannt");
  row("Bereich", title);
  row("Datum", dateStr);

  // Score block
  y += 2;
  doc.setDrawColor(...COL.border);
  doc.setFillColor(...COL.s1);
  doc.roundedRect(leftX, y, 110, 34, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(percent >= 80 ? COL.amber[0] : COL.cyan[0], percent >= 80 ? COL.amber[1] : COL.cyan[1], percent >= 80 ? COL.amber[2] : COL.cyan[2]);
  doc.text(`${percent}%`, leftX + 10, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COL.text2);
  doc.text(`${score} von ${total} richtig`, leftX + 55, y + 22);
  y += 44;

  // Topic stats
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.text2);
  doc.text("THEMENSTATISTIK", leftX, y);
  y += 6;
  topics.forEach((t) => {
    const tPct = t.total > 0 ? t.correct / t.total : 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COL.text);
    doc.text(t.name, leftX, y + 4);
    doc.setTextColor(...COL.text2);
    doc.text(`${t.correct}/${t.total}`, leftX + 92, y + 4, { align: "right" });
    doc.setFillColor(...COL.s2);
    doc.roundedRect(leftX, y + 6, 92, 2.2, 1, 1, "F");
    doc.setFillColor(tPct >= 0.8 ? COL.green[0] : COL.cyan[0], tPct >= 0.8 ? COL.green[1] : COL.cyan[1], tPct >= 0.8 ? COL.green[2] : COL.cyan[2]);
    doc.roundedRect(leftX, y + 6, Math.max(2, 92 * tPct), 2.2, 1, 1, "F");
    y += 12;
  });

  // Right column: badge
  const badgeCx = 220, badgeCy = 115;
  if (badge) {
    drawMark(doc, badgeCx, badgeCy, 34, { ringOnly: true });
    doc.setFillColor(...COL.amber);
    doc.circle(badgeCx, badgeCy, 34 * 0.14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...(badge.key === "bullseye" ? COL.amber : COL.cyan));
    const lines = doc.splitTextToSize(badge.label, 90);
    doc.text(lines, badgeCx, badgeCy + 50, { align: "center" });
  } else {
    drawMark(doc, badgeCx, badgeCy, 30, { ringOnly: true });
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COL.mu);
  doc.text(
    "Kein offizielles Zertifikat — Lernnachweis zur eigenen Lernkontrolle, erstellt mit IT-Dart.",
    leftX,
    H - 14
  );

  const fileSafeTitle = title.replace(/[^a-z0-9äöüß]+/gi, "_").slice(0, 40);
  doc.save(`IT-Dart-Lernnachweis-${fileSafeTitle}.pdf`);

  if (user) {
    supabase.from("lernnachweise").insert({
      user_id: user.id,
      kind,
      title,
      score,
      total,
      percent,
      badge: badge?.key ?? null,
    }).then(() => {});
  }
}
