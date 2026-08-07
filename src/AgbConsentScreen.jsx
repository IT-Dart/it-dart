import { useState, useEffect } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";

// Zeigt sich nach dem ersten Login eines per Einladungslink registrierten
// Kontos (Trainer-/Admin-Einladung) -- dieser Weg durchläuft nie die
// Einwilligungs-Checkbox aus AuthScreen.jsx (dokumentation/
// 29_Anwalt_Pruefauftrag_Rechtstexte.docx, Abschnitt 6, "Fehlender
// Zustimmungsmechanismus bei Einladungslink-Registrierung"). Derselbe
// Wortlaut wie die dortige Checkbox, kein neuer Text.
//
// Nutzerhinweis 2026-08-07: ein per Einladung angelegtes Konto sieht diesen
// Screen als allererstes -- ohne je die Unternehmensseite gesehen zu haben
// (waehrend WARTUNGSMODUS fuer anonyme Besucher gesperrt). Bisher sprang
// der Screen direkt zu "bitte AGB akzeptieren", ohne zu erklaeren, was
// IT-Dart ueberhaupt ist. Jetzt zweistufig, gleiches Muster wie
// ParentConsentConfirmScreen.jsx: erst eine reine Info-Seite, erst danach
// die Checkbox.
export default function AgbConsentScreen({ onOpenLegal }) {
  const [step, setStep] = useState("intro"); // "intro" | "form"
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(false); // kurze Bestaetigung vor dem Reload, statt stillem Sprung -- siehe PasswordSetupScreen.jsx, gleiches Muster.

  const confirm = async () => {
    if (!accepted) { setMsg("Bitte den AGB zustimmen."); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc("confirm_agb_consent");
    setBusy(false);
    if (error) { setMsg("Verbindung fehlgeschlagen. Bitte erneut versuchen."); return; }
    setDone(true);
  };

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => window.location.reload(), 1200);
    return () => clearTimeout(t);
  }, [done]);

  if (done) return (
    <div style={wrap}><div style={{ ...inner, paddingTop: 60, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Danke, bestätigt</h2>
      <p style={{ fontSize: 14, color: C.t2 }}>Du wirst gleich automatisch weitergeleitet...</p>
    </div></div>
  );

  if (step === "intro") return (
    <div style={wrap}><div style={{ ...inner, paddingTop: 60 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Was ist IT-Dart?</h2>
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 14, lineHeight: 1.7 }}>
        IT-Dart ist die Marke hinter „Bleib am Dart!" — einer digitalen Lernplattform für die Ausbildung zum Fachinformatiker für Systemintegration (FISI). Fachmodule, Übungsaufgaben und ein KI-gestützter Lernassistent helfen bei der strukturierten Prüfungsvorbereitung.
      </p>
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 24, lineHeight: 1.7 }}>
        Dein Konto wurde per Einladung angelegt. Bevor es weitergeht, bestätige bitte einmalig unsere Nutzungsbedingungen.
      </p>
      <button onClick={() => setStep("form")} style={{ ...pri, width: "100%", justifyContent: "center" }}>
        Weiter →
      </button>
    </div></div>
  );

  return (
    <div style={wrap}><div style={{ ...inner, paddingTop: 60 }}>
      <button onClick={() => setStep("intro")} style={{ ...ghost, padding: "6px 12px", fontSize: 13, marginBottom: 20 }}>← Zurück</button>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Bevor es weitergeht</h2>
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 24, lineHeight: 1.6 }}>Dein Konto wurde per Einladung angelegt. Bitte bestätige einmalig, dass du unsere Nutzungsbedingungen gelesen hast.</p>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20, fontSize: 13, color: C.t2, lineHeight: 1.6, cursor: "pointer" }}>
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginTop: 2 }} />
        <span>Ich stimme den <button type="button" onClick={() => onOpenLegal?.("agb")} style={{ background: "none", border: "none", color: C.cy, cursor: "pointer", fontSize: 13, fontFamily: ff, textDecoration: "underline", padding: 0 }}>AGB</button> zu und habe die <button type="button" onClick={() => onOpenLegal?.("datenschutz")} style={{ background: "none", border: "none", color: C.cy, cursor: "pointer", fontSize: 13, fontFamily: ff, textDecoration: "underline", padding: 0 }}>Datenschutzerklärung</button> zur Kenntnis genommen.</span>
      </label>
      {msg && <div style={{ background: "#450a0a", border: "0.5px solid #ef4444", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: "#fca5a5", margin: 0, lineHeight: 1.5 }}>{msg}</p>
      </div>}
      <button onClick={confirm} disabled={busy} style={{ ...pri, width: "100%", justifyContent: "center", opacity: busy ? .6 : 1 }}>
        {busy ? "Bitte warten..." : "Bestätigen →"}
      </button>
    </div></div>
  );
}
