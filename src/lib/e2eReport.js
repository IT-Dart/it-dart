// Erzeugt aus einer gespeicherten e2e_runs-Zeile (siehe E2ETestScreen.jsx)
// clientseitig ein PDF — gleiches Vorgehen wie lernnachweis.js: dynamischer
// jsPDF-Import, manuelle Text-Fluss-/Seitenumbruch-Steuerung, keine
// serverseitige PDF-Erzeugung oder Zwischenspeicherung nötig. Anders als
// lernnachweis.js (einseitiges Zertifikat) ist dieser Bericht mehrseitig,
// da die Anzahl der Befunde je Testlauf variiert.
import { COL } from "./lernnachweis.js";

const STATUS_COLOR = { OK: COL.green, OFFEN: COL.amber, FEHLER: COL.red };

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function generateE2EReport(run) {
  const { jsPDF } = await import("jspdf");
  const report = run.report || {};
  const summary = report.summary || {};
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const resultsByRole = Array.isArray(report.results_by_role) ? report.results_by_role : [];
  const incidents = Array.isArray(report.incidents) ? report.incidents : [];
  const openItems = Array.isArray(report.open_items) ? report.open_items : [];
  const testAccounts = Array.isArray(report.test_accounts) ? report.test_accounts : [];

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

  const bullet = (text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    const indent = 6;
    const lines = doc.splitTextToSize(text, contentW - indent);
    newPageIfNeeded(lines.length * 4.5 + 1.5);
    doc.setTextColor(...COL.mu);
    doc.text("-", marginX, y);
    doc.setTextColor(...COL.text2);
    doc.text(lines, marginX + indent, y);
    y += lines.length * 4.5 + 1.8;
  };

  // Statustexte als ASCII-Tags ("OK"/"OFFEN"/"FEHLER"), keine Unicode-
  // Symbole — jsPDFs Standard-Helvetica (WinAnsi-Encoding) stellt ✓/⚠/✗
  // nicht dar, das wurde beim ersten manuellen Testbericht dieser Session
  // bereits festgestellt und korrigiert.
  const statusTag = (status, label) => {
    const color = STATUS_COLOR[status] || COL.mu;
    const indent = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.3);
    newPageIfNeeded(6);
    doc.setTextColor(...color);
    doc.text(status || "?", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COL.text2);
    const lines = doc.splitTextToSize(label, contentW - indent);
    doc.text(lines, marginX + indent, y);
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
  doc.text("IT-Dart – E2E-Testbericht", marginX + 12, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COL.mu);
  doc.text(`Lauf #${run.id} · Suite: ${run.suite}`, marginX + 12, 24);

  y = 36;
  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, W - marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.mu);
  doc.text(`Gestartet: ${fmtDateTime(run.created_at)}`, marginX, y);
  doc.text(`Abgeschlossen: ${fmtDateTime(run.finished_at)}`, marginX, y + 5);
  doc.text(`Status: ${run.status}`, marginX, y + 10);
  y += 20;

  // ---------- Zusammenfassung ----------
  // Mehrzeilige Ampel-Zusammenfassung (Status-Tag je Kernaussage), nach dem
  // Vorbild des ersten manuellen Testberichts dieser Session — hier
  // generisch aus run.report abgeleitet statt handkuratiert.
  h1("Zusammenfassung");
  if (typeof summary.total === "number") {
    const okCount = findings.filter((f) => f.status === "OK").length;
    const openCount = findings.filter((f) => f.status !== "OK").length;
    statusTag(
      summary.failed ? "FEHLER" : "OK",
      `${summary.passed ?? 0} von ${summary.total} Prüfungen bestanden (${summary.failed ?? 0} fehlgeschlagen).`
    );
    if (findings.length) {
      statusTag(openCount ? "FEHLER" : "OK", `${findings.length} Befund(e) erfasst — ${okCount} behoben, ${openCount} offen.`);
    }
    if (resultsByRole.length) {
      statusTag("OK", `${resultsByRole.length} Rolle(n) durchlaufen: ${resultsByRole.map((r) => r.role).join(", ")}.`);
    }
    if (incidents.length) {
      statusTag("OFFEN", `${incidents.length} Zwischenfall/-fälle während des Laufs — siehe unten.`);
    }
    if (openItems.length) {
      statusTag("OFFEN", `${openItems.length} offene(r) Punkt(e) — siehe unten.`);
    }
  } else {
    statusTag(summary.status || "OFFEN", "Noch keine abschließende Bewertung für diesen Lauf.");
  }
  spacer(4);

  // ---------- Befunde ----------
  if (findings.length) {
    h1("Gefundene Punkte");
    findings.forEach((f, i) => {
      h2(`${i + 1}. ${f.symptom || "Unbenannter Befund"}`);
      if (f.symptom) para(`Symptom: ${f.symptom}`, { indent: 3 });
      if (f.ursache) para(`Ursache: ${f.ursache}`, { indent: 3 });
      if (f.fix) para(`Fix: ${f.fix}`, { indent: 3 });
      statusTag(f.status || "OFFEN", `Status: ${f.status === "OK" ? "behoben" : f.status === "FEHLER" ? "noch offen" : "in Bearbeitung"}`);
      spacer(3);
    });
  }

  // ---------- Ergebnisse nach Rolle ----------
  if (resultsByRole.length) {
    h1("Testergebnisse nach Rolle");
    resultsByRole.forEach((r) => {
      h2(r.role || "Unbenannte Rolle");
      bullet(`${r.passed ?? 0} bestanden, ${r.failed ?? 0} fehlgeschlagen.`);
      if (r.notes) bullet(r.notes);
      spacer(2);
    });
  }

  // ---------- Zwischenfälle ----------
  if (incidents.length) {
    h1("Zwischenfälle während des Tests");
    incidents.forEach((i) => bullet(i));
    spacer(4);
  }

  // ---------- Offene Punkte ----------
  if (openItems.length) {
    h1("Offene Punkte");
    openItems.forEach((i) => bullet(i));
    spacer(4);
  }

  // ---------- Testkonten ----------
  if (testAccounts.length) {
    h1("Verwendete Testkonten");
    testAccounts.forEach((a) => bullet(`${a.role || "Rolle"}: ${a.email || "—"}`));
  }

  if (run.gh_workflow_url) {
    spacer(4);
    para(`GitHub-Actions-Lauf: ${run.gh_workflow_url}`, { size: 8, color: COL.mu });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COL.mu);
    doc.text(`IT-Dart – E2E-Testbericht #${run.id}`, marginX, H - 10);
    doc.text(`Seite ${i} / ${pageCount}`, W - marginX, H - 10, { align: "right" });
  }

  const dateStr = (run.created_at || new Date().toISOString()).slice(0, 10);
  doc.save(`IT-Dart-E2E-Testbericht_${dateStr}_Lauf${run.id}.pdf`);
}
