import { C, pri, wrap, inner } from "./lib/theme";
import { Logo } from "./ITDart";

// Zwischenseite für per Messenger (WhatsApp etc.) geteilte Magic-Links. Nie
// den rohen Supabase-Link direkt teilen: Messenger rufen geteilte Links oft
// serverseitig ab, um eine Vorschaukarte zu bauen -- bei einem Einmal-Link
// würde genau dieser automatische Abruf den Token schon verbrauchen, bevor
// der eigentliche Empfänger ihn anklickt. Diese Seite navigiert deshalb nur
// nach einem echten Klick (JS-Interaktion, die kein Vorschau-Crawler
// auslöst), nie automatisch beim Laden. `link` ist bereits in ITDart.jsx
// gegen ein festes Supabase-Präfix validiert -- diese Komponente prüft
// nicht erneut und ist daher selbst kein offener Redirector.
export default function EinladungScreen({ link }) {
  return (
    <div style={wrap}><div style={{ ...inner, paddingTop: 60, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Logo sz={56} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Du wurdest zu IT-Dart eingeladen</h2>
      <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, marginBottom: 28 }}>Dein Trainer hat dich zur Lernplattform für die FISI-Ausbildung eingeladen. Klicke unten, um dich anzumelden.</p>
      <button onClick={() => { window.location.href = link; }} style={{ ...pri, justifyContent: "center" }}>Jetzt anmelden →</button>
    </div></div>
  );
}
