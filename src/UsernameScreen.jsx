import { useState } from "react";
import { C, pri, ghost, wrap, inner } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";

// Zwei Modi ueber dieselbe Komponente:
//  - mandatory=true: einmaliger Willkommens-Screen nach dem ersten Login
//    (App.jsx-Gate needsUsernameWelcome), kein Zurueck-Button.
//  - mandatory=false: jederzeit spaeter ueber den Link auf dem Cover-Screen
//    erreichbar, um den Nutzernamen zu aendern (30-Tage-Cooldown serverseitig
//    in set_username() erzwungen).
export default function UsernameScreen({ mandatory = false, onClose }) {
  const { username: currentUsername } = useAuth();
  const [value, setValue] = useState(currentUsername || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const acceptGenerated = async () => {
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc("confirm_username_seen");
    setBusy(false);
    if (error) { setMsg({ type: "error", text: "Verbindung fehlgeschlagen. Bitte erneut versuchen." }); return; }
    window.location.reload();
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc("set_username", { new_username: value.trim() });
    setBusy(false);
    if (error) { setMsg({ type: "error", text: error.message || "Nutzername konnte nicht gespeichert werden." }); return; }
    if (mandatory) window.location.reload();
    else { setMsg({ type: "info", text: "Gespeichert." }); onClose?.(); }
  };

  return (
    <div style={wrap}><div style={{ ...inner, paddingTop: 60 }}>
      {mandatory ? (<>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dein Nutzername</h2>
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 24, lineHeight: 1.6 }}>Wir haben dir einen Nutzernamen zugeteilt — er wird z. B. deinem Trainer statt deiner E-Mail-Adresse angezeigt. Du kannst ihn übernehmen oder direkt ändern.</p>
      </>) : (<>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={onClose} style={{ ...ghost, padding: "6px 12px", fontSize: 13 }}>← Zurück</button>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Nutzername ändern</h2>
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 24, lineHeight: 1.6 }}>Änderungen sind alle 30 Tage möglich.</p>
      </>)}
      <form onSubmit={submit}>
        <input value={value} onChange={e => setValue(e.target.value)} type="text" maxLength={20} placeholder="Nutzername" style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" }} />
        {msg && <div style={{ background: msg.type === "error" ? "#450a0a" : "#052e16", border: `0.5px solid ${msg.type === "error" ? "#ef4444" : "#22c55e"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: msg.type === "error" ? "#fca5a5" : "#86efac", margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
        </div>}
        {/* Im Pflicht-Modus ist "Speichern" bewusst nur aktiv, wenn der Name
            tatsaechlich geaendert wurde -- sonst sind Speichern und "Diesen
            Namen uebernehmen" fuer den generierten Namen ununterscheidbar,
            und ein Klick auf Speichern wuerde unnoetig den 30-Tage-Cooldown
            starten, obwohl sich nichts geaendert hat (realer Nutzerfund
            2026-08-07). */}
        <button type="submit" disabled={busy || !value.trim() || (mandatory && value.trim() === (currentUsername || "").trim())} style={{ ...pri, width: "100%", justifyContent: "center", opacity: busy ? .6 : 1, marginBottom: mandatory ? 10 : 0 }}>
          {busy ? "Bitte warten..." : "Ändern & Speichern →"}
        </button>
      </form>
      {mandatory && <button onClick={acceptGenerated} disabled={busy} style={{ background: "none", border: "none", color: C.cy, cursor: "pointer", fontSize: 13, textDecoration: "underline", width: "100%", textAlign: "center" }}>
        Diesen Namen übernehmen und weiter →
      </button>}
    </div></div>
  );
}
