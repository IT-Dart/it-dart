import { useEffect, useState } from "react";
import { C, ghost, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";

const FIELD_LABELS = { is_admin: "Admin", is_premium: "Premium", premium_until: "Premium bis", is_trainer: "Trainer", is_junior_admin: "Junior-Admin", trainee_limit: "Trainee-Limit", ai_enabled: "KI aktiv", interview_enabled: "Mock-Interview aktiv" };

function diffFields(before, after) {
  if (!before || !after) return [];
  return Object.keys(FIELD_LABELS).filter(k => before[k] !== after[k]);
}

export default function AuditLogScreen({ onClose }) {
  const [entries, setEntries] = useState(null); // null=lädt noch

  const load = async () => {
    const { data, error } = await supabase.rpc("get_admin_action_log", { row_limit: 200 });
    if (error) { console.error("[AuditLogScreen] load failed:", error.message); setEntries([]); return; }
    setEntries(data || []);
  };
  useEffect(() => { load(); }, []);

  return (
    <div style={wrap}><div style={inner}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `0.5px solid ${C.bd}` }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>📜 Audit-Log</span>
        <button onClick={onClose} style={{ ...ghost, marginLeft: "auto", fontSize: 13, padding: "6px 12px" }}>← Zurück</button>
      </div>

      <p style={{ fontSize: 12, color: C.mu, marginBottom: 16 }}>
        Protokolliert jede Änderung an Admin-/Premium-/Trainer-/Junior-Admin-Status, Trainee-Limit oder KI-Freischaltung sowie jede Kontolöschung — automatisch per Datenbank-Trigger, unabhängig davon, über welchen Weg (Admin-Board, Junior-Admin-Funktion, interne Funktion) die Änderung ausgelöst wurde. „Akteur" ist nur bekannt, wenn die Änderung mit einer angemeldeten Sitzung ausgelöst wurde — bei internen, service-seitigen Vorgängen bleibt das Feld leer, die Änderung selbst wird trotzdem erfasst.
      </p>

      {entries === null && <p style={{ fontSize: 12, color: C.mu }}>Lädt…</p>}
      {entries?.length === 0 && <p style={{ fontSize: 12, color: C.mu }}>Noch keine Einträge.</p>}
      {entries?.length > 0 && <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ color: C.mu, textAlign: "left" }}>
            <th style={{ padding: "4px 8px 6px 0", fontWeight: 600 }}>Zeitpunkt</th>
            <th style={{ padding: "4px 8px 6px 0", fontWeight: 600 }}>Akteur</th>
            <th style={{ padding: "4px 8px 6px 0", fontWeight: 600 }}>Ziel</th>
            <th style={{ padding: "4px 0 6px", fontWeight: 600 }}>Änderung</th>
          </tr></thead>
          <tbody>
            {entries.map(e => {
              const isDeletion = e.action === "profile_deleted";
              const changed = isDeletion ? [] : diffFields(e.before, e.after);
              return (
                <tr key={e.id} style={{ borderTop: `0.5px solid ${C.bd}` }}>
                  <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap", color: C.t2 }}>{new Date(e.created_at).toLocaleString("de-DE")}</td>
                  <td style={{ padding: "6px 8px 6px 0" }}>{e.actor_email || <span style={{ color: C.mu }}>—</span>}</td>
                  <td style={{ padding: "6px 8px 6px 0" }}>{e.target_email || e.before?.email || <span style={{ color: C.mu }}>—</span>}</td>
                  <td style={{ padding: "6px 0 6px" }}>
                    {isDeletion
                      ? <span style={{ color: "#fca5a5" }}>Konto gelöscht</span>
                      : changed.map(k => (
                        <span key={k} style={{ marginRight: 10 }}>
                          {FIELD_LABELS[k]}: <span style={{ color: C.mu }}>{String(e.before[k])}</span> → <span style={{ fontWeight: 600 }}>{String(e.after[k])}</span>
                        </span>
                      ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </div></div>
  );
}
