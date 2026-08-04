import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { Logo } from "./Logo";
import { canonicalUrl } from "./lib/nav";

// Temporäre Ersatzseite für anonyme Besucher (Wartungsmodus-Schalter in
// App.jsx, WARTUNGSMODUS). Bereits eingeloggte Nutzer sehen diese Seite nie
// — App.jsx routet sie automatisch direkt zu "app". Der Login-Link führt
// über dasselbe ?mode=login-Muster wie CompanyScreen.jsx, damit bekannte
// Nutzer ohne aktive Sitzung trotzdem reinkommen.
export default function WartungScreen({ onOpenLegal }) {
  return (
    <div style={wrap}>
      <div style={{ ...inner, textAlign: "center", paddingTop: 80, paddingBottom: 60 }}>
        <Logo sz={64} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 2 }}>IT-Dart</h2>
        <p style={{ fontSize: 13, color: C.cy, fontWeight: 700, letterSpacing: 0.3, marginBottom: 0 }}>Gezielt ans Ziel.</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 10, marginBottom: 10 }}>Wir sind gerade im Aufbau.</h1>
        <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, marginBottom: 32 }}>
          IT-Dart wird derzeit überarbeitet. Schau in Kürze wieder vorbei.
        </p>
        <a
          href={canonicalUrl("/?mode=login")}
          style={{ ...pri, width: "100%", justifyContent: "center", padding: "14px 18px", fontSize: 15, textDecoration: "none", boxSizing: "border-box" }}
        >
          Bereits Zugang? Hier anmelden →
        </a>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 40 }}>
          <button onClick={() => onOpenLegal("impressum")} style={{ background: "none", border: "none", color: C.mu, cursor: "pointer", fontSize: 11, textDecoration: "underline", padding: 0, fontFamily: ff }}>Impressum</button>
          <button onClick={() => onOpenLegal("datenschutz")} style={{ background: "none", border: "none", color: C.mu, cursor: "pointer", fontSize: 11, textDecoration: "underline", padding: 0, fontFamily: ff }}>Datenschutz</button>
        </div>
      </div>
    </div>
  );
}
