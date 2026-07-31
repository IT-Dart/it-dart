import { C, pri, wrap, inner } from "./lib/theme";
import { describeHashError } from "./lib/errorText";

// Wird gezeigt, wenn ein Magic-Link (Einladung, Login, Passwort-Reset)
// abgelaufen oder bereits verwendet war -- Supabase schickt den Browser
// dann mit `#error=access_denied&error_code=...` statt einer gültigen
// Session zurück (siehe authError in AuthContext.jsx). Ohne diesen Screen
// landet der Nutzer stillschweigend auf der normalen Unternehmensseite,
// ohne zu erfahren, warum der Link nicht funktioniert hat.
export default function AuthErrorScreen({ authError, onDismiss }) {
  return (
    <div style={wrap}><div style={{ ...inner, paddingTop: 60, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link ungültig oder abgelaufen</h2>
      <p style={{ fontSize: 14, color: C.t2, marginBottom: 24, lineHeight: 1.6 }}>
        {describeHashError(authError?.code)}
      </p>
      <button onClick={onDismiss} style={{ ...pri, justifyContent: "center" }}>Zur Anmeldung →</button>
    </div></div>
  );
}
