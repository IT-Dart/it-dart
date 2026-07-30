import { useState } from "react";
import { C, pri, ghost, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

// Kurzer, überspringbarer Feedback-Fragebogen (To-Do #68) -- zwei
// Einsatzorte: einmalig nach dem Onboarding (ITDart.jsx) und nach jeder
// abgeschlossenen Prüfungsvorbereitung (Pruefung.jsx). Schreibt direkt in
// feedback_responses (RLS: Nutzer darf nur eigene Zeile anlegen, nie lesen).
const textarea = { width: "100%", minHeight: 70, background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical", marginTop: 8 };

export default function FeedbackUmfrage({ type, question, placeholder, withRating = false, onDone }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!user) { onDone?.(); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("feedback_responses").insert({
      user_id: user.id,
      type,
      rating: withRating && rating > 0 ? rating : null,
      message: message.trim() || null,
    });
    setBusy(false);
    if (error) { setErr(describeError(error)); return; }
    onDone?.();
  };

  return (
    <div style={{ textAlign: "left", background: C.s1, border: `0.5px solid ${C.bd}`, borderRadius: 12, padding: "14px 16px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.t, margin: "0 0 8px" }}>{question}</p>
      {withRating && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0, opacity: n <= rating ? 1 : 0.3 }}>⭐</button>
          ))}
        </div>
      )}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={placeholder} style={textarea} />
      {err && <p style={{ fontSize: 12, color: "#fca5a5", margin: "8px 0 0" }}>{err}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={submit} disabled={busy} style={{ ...pri, fontSize: 12, padding: "8px 14px", opacity: busy ? 0.6 : 1 }}>{busy ? "..." : "Absenden"}</button>
        <button onClick={() => onDone?.()} disabled={busy} style={{ ...ghost, fontSize: 12, padding: "8px 14px" }}>Vielleicht später</button>
      </div>
    </div>
  );
}
