import { C, ghost, wrap, inner } from "./lib/theme";

const h2={fontSize:16,fontWeight:700,marginTop:28,marginBottom:8,color:C.t};
const p={fontSize:13,color:C.t2,lineHeight:1.7,marginBottom:10};
const li={fontSize:13,color:C.t2,lineHeight:1.8};

const LegalLayout=({title,onClose,children})=>(
  <div style={wrap}><div style={{...inner,paddingBottom:60}}>
    <button onClick={onClose} style={{...ghost,padding:"6px 12px",fontSize:13,marginBottom:24}}>← Zurück</button>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:24,color:C.t}}>{title}</h1>
    {children}
  </div></div>
);

export function Impressum({onClose}){
  return(
    <LegalLayout title="Impressum" onClose={onClose}>
      <p style={p}>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>

      <h2 style={h2}>Betreiber</h2>
      <p style={p}>
        Coskun Selim Bulut<br/>
        Carl-Orff-Bogen 195<br/>
        80939 München<br/>
        Deutschland
      </p>

      <h2 style={h2}>Kontakt</h2>
      <p style={p}>E-Mail: kontakt@it-dart.de</p>

      <h2 style={h2}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p style={p}>Coskun Selim Bulut (Anschrift wie oben)</p>

      <h2 style={h2}>Streitschlichtung</h2>
      <p style={p}>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer" style={{color:C.cy}}>ec.europa.eu/consumers/odr</a>. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </LegalLayout>
  );
}

export function Datenschutz({onClose}){
  return(
    <LegalLayout title="Datenschutzerklärung" onClose={onClose}>
      <h2 style={h2}>1. Verantwortlicher</h2>
      <p style={p}>
        Coskun Selim Bulut<br/>
        Carl-Orff-Bogen 195, 80939 München<br/>
        E-Mail: kontakt@it-dart.de
      </p>

      <h2 style={h2}>2. Welche Daten wir verarbeiten</h2>
      <ul style={{paddingLeft:20,marginBottom:10}}>
        <li style={li}>E-Mail-Adresse und Passwort (verschlüsselt gespeichert) bei der Registrierung</li>
        <li style={li}>Lernfortschritt (welche Themen/Module du bearbeitet hast)</li>
        <li style={li}>Premium-Status und dessen Gültigkeitsdauer</li>
        <li style={li}>Protokoll erzeugter Lernnachweise (Zeitpunkt, Bereich, Ergebnis)</li>
        <li style={li}>Anfragen an den KI-Chat (werden zur Beantwortung an Anthropic übermittelt, siehe Punkt 4)</li>
      </ul>

      <h2 style={h2}>3. Zweck und Rechtsgrundlage</h2>
      <p style={p}>Die Verarbeitung erfolgt zur Bereitstellung der Lernplattform (Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung) sowie zum Schutz vor Missbrauch, z. B. Begrenzung der KI-Chat-Nutzung (Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse).</p>

      <h2 style={h2}>4. Empfänger / eingesetzte Dienstleister</h2>
      <p style={p}>Zur Bereitstellung des Angebots setzen wir folgende Auftragsverarbeiter bzw. Drittanbieter ein:</p>
      <ul style={{paddingLeft:20,marginBottom:10}}>
        <li style={li}><strong style={{color:C.t}}>Supabase</strong> (Datenbank, Login) — verarbeitet alle unter Punkt 2 genannten Daten</li>
        <li style={li}><strong style={{color:C.t}}>Vercel Inc.</strong> (USA) — Hosting der Webanwendung</li>
        <li style={li}><strong style={{color:C.t}}>Anthropic PBC</strong> (USA) — Verarbeitung deiner Frage beim KI-Chat, um eine Antwort zu erzeugen; es werden keine Konto- oder Kontaktdaten übermittelt, nur die gestellte Frage und der Lernkontext</li>
        <li style={li}><strong style={{color:C.t}}>Discord Inc.</strong> (USA) — erhält bei einer Neuregistrierung ausschließlich die E-Mail-Adresse, um uns intern zu benachrichtigen; keine weitere Verwendung</li>
      </ul>
      <p style={p}>Bei Übermittlung in die USA erfolgt dies auf Grundlage von Standardvertragsklauseln der jeweiligen Anbieter.</p>

      <h2 style={h2}>5. Speicherdauer</h2>
      <p style={p}>Deine Daten werden gespeichert, solange dein Konto besteht. Du kannst dein Konto und alle damit verbundenen Daten jederzeit selbst und vollständig löschen (siehe Punkt 6).</p>

      <h2 style={h2}>6. Deine Rechte</h2>
      <p style={p}>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Dein Konto kannst du direkt in der App unter "Konto löschen" endgültig entfernen — das löscht automatisch auch deinen Lernfortschritt, Premium-Status und alle Protokolle. Für alle anderen Anliegen erreichst du uns unter der oben genannten E-Mail-Adresse. Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>

      <h2 style={h2}>7. Speicherung im Browser</h2>
      <p style={p}>Zur Aufrechterhaltung deiner Anmeldung wird ein Sitzungs-Token im lokalen Speicher (localStorage) deines Browsers abgelegt. Es werden keine Marketing- oder Tracking-Cookies eingesetzt.</p>

      <h2 style={h2}>8. Änderungen</h2>
      <p style={p}>Diese Datenschutzerklärung kann bei Weiterentwicklung des Angebots angepasst werden. Es gilt die jeweils aktuelle, hier abrufbare Fassung.</p>
    </LegalLayout>
  );
}
