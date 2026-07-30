import { C, pri, wrap, inner } from "./lib/theme";

// Wird gezeigt, sobald der Herzschlag in AuthContext.jsx erkennt, dass ein
// anderes Geraet diese Sitzung per force uebernommen hat (Aktiver
// Sitzungs-Kick-out, To-Do #6) -- ohne diesen Screen wuerde die Seite hier
// einfach unvermittelt zur Unternehmensseite zurueckspringen, ohne dass klar
// wird, warum man plötzlich abgemeldet ist.
export default function KickedOutScreen({ onDismiss }) {
  return (
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Du wurdest abgemeldet</h2>
      <p style={{fontSize:14,color:C.t2,marginBottom:8,lineHeight:1.6}}>
        Dein Konto wurde soeben auf einem anderen Gerät angemeldet. Da nur eine aktive Sitzung gleichzeitig erlaubt ist, wurdest du hier automatisch abgemeldet.
      </p>
      <p style={{fontSize:13,color:C.mu,marginBottom:24,lineHeight:1.6}}>
        Warst das nicht du? Bitte ändere umgehend dein Passwort und kontaktiere uns unter kontakt@it-dart.de.
      </p>
      <button onClick={onDismiss} style={{...pri,justifyContent:"center"}}>Zur Anmeldung →</button>
    </div></div>
  );
}
