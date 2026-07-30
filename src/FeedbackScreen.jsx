import { useEffect, useState } from "react";
import { C, ghost, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const TYPE_LABEL = { onboarding: "Onboarding", pruefung: "Prüfungsvorbereitung" };
const fmtDate = (iso) => new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Admin-Auswertung für die Feedback-Fragebögen (To-Do #68). Rein lesend --
// feedback_responses hat bewusst keine Update/Delete-Policy, Antworten
// bleiben unveränderlich. user_id zeigt auf auth.users, nicht direkt auf
// profiles -- zwei getrennte Abfragen statt eines PostgREST-Embeds, das
// über diese Beziehung nicht zuverlässig aufgelöst wird.
export default function FeedbackScreen({ onClose }) {
  const [rows, setRows] = useState(null); // null = lädt noch
  const [emails, setEmails] = useState({}); // user_id -> email
  const [filter, setFilter] = useState("all"); // "all" | "onboarding" | "pruefung"
  const [err, setErr] = useState(null);

  const load = async () => {
    const { data, error } = await supabase.from("feedback_responses").select("*").order("created_at", { ascending: false });
    if (error) { setErr(describeError(error)); setRows([]); return; }
    setRows(data || []);
    const ids = [...new Set((data || []).map((r) => r.user_id))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,email").in("id", ids);
      setEmails(Object.fromEntries((profiles || []).map((p) => [p.id, p.email])));
    }
  };
  useEffect(() => { load(); }, []);

  const visible = (rows || []).filter((r) => filter === "all" || r.type === filter);
  const counts = { all: rows?.length || 0, onboarding: rows?.filter((r) => r.type === "onboarding").length || 0, pruefung: rows?.filter((r) => r.type === "pruefung").length || 0 };
  const ratings = (rows || []).filter((r) => r.type === "pruefung" && r.rating).map((r) => r.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  return (
    <div style={wrap}><div style={inner}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `0.5px solid ${C.bd}` }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>💬 Feedback</span>
        <button onClick={onClose} style={{ ...ghost, marginLeft: "auto", fontSize: 13, padding: "6px 12px" }}>← Zurück</button>
      </div>

      {err && <div style={{ background: "#450a0a", border: "0.5px solid #ef4444", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>{err}</p>
      </div>}

      {avgRating && <p style={{ fontSize: 12, color: C.mu, marginBottom: 16 }}>⭐ Ø-Bewertung Prüfungsvorbereitung: <b style={{ color: C.t }}>{avgRating}</b> ({ratings.length} Bewertungen)</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all", `Alle (${counts.all})`], ["onboarding", `Onboarding (${counts.onboarding})`], ["pruefung", `Prüfungsvorbereitung (${counts.pruefung})`]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ ...ghost, fontSize: 12, padding: "6px 12px", background: filter === k ? C.s2 : "transparent", color: filter === k ? C.t : C.t2, borderColor: filter === k ? C.cy : C.bd }}>{label}</button>
        ))}
      </div>

      {rows === null && <p style={{ fontSize: 13, color: C.mu, textAlign: "center", padding: "20px 0" }}>Lädt…</p>}
      {rows !== null && visible.length === 0 && <p style={{ fontSize: 13, color: C.mu, textAlign: "center", padding: "20px 0" }}>Keine Einträge.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((r) => (
          <div key={r.id} style={{ background: C.s1, border: `0.5px solid ${C.bd}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em" }}>{TYPE_LABEL[r.type] || r.type}</span>
              <span style={{ fontSize: 11, color: C.mu }}>{emails[r.user_id] || r.user_id} · {fmtDate(r.created_at)}</span>
            </div>
            {r.rating && <p style={{ margin: "0 0 6px", fontSize: 14 }}>{"⭐".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>}
            {r.message ? <p style={{ fontSize: 13, color: C.t, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.message}</p> : <p style={{ fontSize: 12, color: C.mu, margin: 0, fontStyle: "italic" }}>Kein Freitext.</p>}
          </div>
        ))}
      </div>
    </div></div>
  );
}
