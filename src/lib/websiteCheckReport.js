// Erzeugt aus einer gespeicherten website_checks-Zeile (siehe
// WebsiteCheckScreen.jsx) clientseitig ein PDF — gleiches Vorgehen wie
// e2eReport.js/lernnachweis.js: dynamischer jsPDF-Import, manuelle
// Text-Fluss-/Seitenumbruch-Steuerung, keine serverseitige PDF-Erzeugung.
// Als eigenständiges, professionell wirkendes Dokument gedacht, das z. B.
// im Rahmen eines "wir checken Ihre Seite"-Angebots an Dritte gehen kann.
import { COL } from "./lernnachweis.js";

const STATUS_COLOR = { OK: COL.green, WARN: COL.amber, FEHLER: COL.red };

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function generateWebsiteCheckReport(check) {
  const { jsPDF } = await import("jspdf");
  const report = check.report || {};
  const summary = report.summary || {};
  const target = report.target || {};
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const findings = Array.isArray(report.findings) ? report.findings : [];

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const marginX = 20;
  const contentW = W - marginX * 2;
  let y = 20;

  const newPageIfNeeded = (needed) => {
    if (y + needed > H - 18) {
      doc.addPage();
      y = 20;
    }
  };

  const h1 = (text) => {
    newPageIfNeeded(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COL.blue);
    doc.text(text, marginX, y);
    y += 3;
    doc.setDrawColor(...COL.border);
    doc.setLineWidth(0.4);
    doc.line(marginX, y, W - marginX, y);
    y += 8;
  };

  const h2 = (text) => {
    newPageIfNeeded(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...COL.cyan);
    doc.text(text, marginX, y);
    y += 7;
  };

  const para = (text, opts = {}) => {
    const indent = opts.indent ?? 0;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9.5);
    doc.setTextColor(...(opts.color ?? COL.text2));
    const lines = doc.splitTextToSize(text, contentW - indent);
    newPageIfNeeded(lines.length * 4.6 + 2);
    doc.text(lines, marginX + indent, y);
    y += lines.length * 4.6 + 2.5;
  };

  const statusTag = (status, label, indent = 0) => {
    const color = STATUS_COLOR[status] || COL.mu;
    const tagIndent = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.3);
    newPageIfNeeded(6);
    doc.setTextColor(...color);
    doc.text(status || "?", marginX + indent, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COL.text2);
    const lines = doc.splitTextToSize(label, contentW - tagIndent - indent);
    doc.text(lines, marginX + tagIndent + indent, y);
    y += lines.length * 4.5 + 1.8;
  };

  const spacer = (n = 4) => { y += n; };

  // ---------- Kopfbereich ----------
  doc.setFillColor(...COL.blue);
  doc.circle(marginX + 4, 16, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.circle(marginX + 4, 16, 2.1, "F");
  doc.setFillColor(...COL.cyan);
  doc.circle(marginX + 4, 16, 0.9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COL.text);
  doc.text("IT-Dart – Website-Analyse", marginX + 12, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COL.mu);
  doc.text(target.final_url || target.input_url || check.url || "—", marginX + 12, 24);

  y = 36;
  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, W - marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.mu);
  doc.text(`Geprüft: ${fmtDateTime(check.created_at)}`, marginX, y);
  doc.text(`HTTP-Status: ${target.status_code ?? "—"}`, marginX, y + 5);
  y += 16;

  // ---------- Zusammenfassung ----------
  h1("Zusammenfassung");
  if (typeof summary.total === "number") {
    statusTag(summary.status || "WARN", `${summary.ok ?? 0} von ${summary.total} Prüfungen bestanden — ${summary.warn ?? 0} Hinweis(e), ${summary.error ?? 0} Fehler.`);
  } else {
    statusTag("WARN", check.error_text || "Keine Zusammenfassung verfügbar.");
  }
  spacer(4);

  // ---------- Alle Prüfungen (kompakte Checkliste) ----------
  if (checks.length) {
    h1("Alle Prüfungen");
    const byCategory = {};
    for (const c of checks) {
      (byCategory[c.category] ??= []).push(c);
    }
    for (const [category, items] of Object.entries(byCategory)) {
      h2(category);
      for (const c of items) statusTag(c.status, `${c.label}: ${c.detail}`);
      spacer(3);
    }
  }

  // ---------- Gefundene Punkte (mit Ursache & Fix) ----------
  if (findings.length) {
    h1("Gefundene Punkte & Empfehlungen");
    findings.forEach((f, i) => {
      h2(`${i + 1}. ${f.symptom || "Unbenannter Befund"}`);
      if (f.ursache) para(`Ursache: ${f.ursache}`, { indent: 3 });
      if (f.fix) para(`Empfehlung: ${f.fix}`, { indent: 3 });
      statusTag(f.status || "WARN", f.status === "FEHLER" ? "Sollte zeitnah behoben werden" : "Empfehlung, keine Dringlichkeit");
      spacer(3);
    });
  } else if (checks.length) {
    h1("Gefundene Punkte & Empfehlungen");
    para("Keine Auffälligkeiten gefunden.");
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COL.mu);
    doc.text(`IT-Dart – Website-Analyse #${check.id}`, marginX, H - 10);
    doc.text(`Seite ${i} / ${pageCount}`, W - marginX, H - 10, { align: "right" });
  }

  const dateStr = (check.created_at || new Date().toISOString()).slice(0, 10);
  const hostForFilename = (target.final_url || target.input_url || check.url || "website").replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 60);
  doc.save(`IT-Dart-Website-Analyse_${hostForFilename}_${dateStr}.pdf`);
}
