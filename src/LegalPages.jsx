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

// Datengetrieben statt Fließtext: eine spätere Feature-Flag-/API-gesteuerte
// Bezahl-/Credit-Anbindung (Premium-Inhalte, Zertifikate, Analysen) kann so
// an genau dieser Stelle einzelne Pakete ergänzen oder Preise dynamisch
// nachladen, ohne die Seite selbst umzubauen. Bewusst ohne feste Euro-
// Beträge — die Konditionen sind laut Auftrag ausdrücklich variabel und
// werden individuell abgestimmt, keine erfundenen Zahlen auf einer echten
// Produktivseite.
const PACKAGES=[
  {
    name:"Einzelzugang",
    zielgruppe:"Einzelne Auszubildende & Selbstlernende",
    umfang:["1 persönliches Konto","Voller Funktionsumfang (Module, Prüfungsvorbereitung, KI-Lernassistent)","Monatlich oder dauerhaft"],
  },
  {
    name:"Ausbildungsbetrieb",
    zielgruppe:"Betriebe mit mehreren Auszubildenden",
    umfang:["Trainer-Konto mit skalierbarem Platz-Kontingent","Zentrale Status- und Fortschrittsübersicht je Auszubildendem","Eigenständige Einladung neuer Auszubildender ohne Verwaltungsaufwand"],
  },
  {
    name:"Unternehmen / Enterprise",
    zielgruppe:"Größere Organisationen & mehrere Standorte",
    umfang:["Individuelles Lizenzmodell nach Nutzerzahl","Dediziertes Onboarding und Ansprechpartner","Erweiterbar um unternehmensspezifische Inhalte"],
  },
];

const card={background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"16px 18px",marginBottom:12};
const cardTitle={fontSize:14,fontWeight:700,color:C.t,marginBottom:2};
const cardSub={fontSize:12,color:C.cy,marginBottom:10};

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

export function Leistungen({onClose}){
  return(
    <LegalLayout title="Leistungen & Pakete" onClose={onClose}>
      <p style={p}>IT-Dart ist eine digitale Lernplattform mit einem skalierbaren Account-Modell und flexibel anpassbaren Preis- und Lizenzstrukturen — von der einzelnen Auszubildenden-Person bis zum ganzen Ausbildungsbetrieb.</p>

      <h2 style={h2}>1. IT-Dart Lernplattform</h2>
      <p style={p}>Digitale Bildung und strukturierte Prüfungsvorbereitung für angehende Fachinformatiker/-innen für Systemintegration und Auszubildende: acht aufeinander aufbauende Lernmodule, praxisnahe Fallbeispiele, ein kontextbezogener KI-Lernassistent sowie eine IHK-nahe Prüfungssimulation mit automatischer Auswertung und Lernnachweis.</p>

      <h2 style={h2}>2. Skalierbares Account- & Benutzermodell</h2>
      <p style={p}>Sichere Authentifizierung und rollenbasierte Zugriffsrechte (RBAC) auf Basis von Supabase — vom Einzelkonto bis zu mehreren hundert Nutzenden:</p>
      <ul style={{paddingLeft:20,marginBottom:10}}>
        <li style={li}>Einladungsbasierter Zugang mit E-Mail-Bestätigung, kein offener Registrierungsprozess</li>
        <li style={li}>Abgestufte Rollen: Free-/Premium-Konto, Ausbilder-Konto mit eigener Gruppe, Verwaltung</li>
        <li style={li}>Durchgehende Rechtetrennung auf Datenbankebene (Row-Level-Security) statt reiner Oberflächenprüfung</li>
        <li style={li}>Selbstverwaltung für Ausbildungsbetriebe: eigene Auszubildende einladen, Status und Fortschritt einsehen, ohne dass wir bei jedem Vorgang eingebunden werden müssen</li>
      </ul>

      <h2 style={h2}>3. Flexibles Preis- & Lizenzmodell</h2>
      <p style={p}>Die Konditionen sind bewusst dynamisch konfigurierbar und richten sich nach Nutzerzahl, Lizenzdauer und gewünschtem Funktionsumfang — kein starres Einheitsmodell:</p>
      {PACKAGES.map(pkg=>(
        <div key={pkg.name} style={card}>
          <div style={cardTitle}>{pkg.name}</div>
          <div style={cardSub}>{pkg.zielgruppe}</div>
          <ul style={{paddingLeft:18,margin:0}}>
            {pkg.umfang.map(item=><li key={item} style={li}>{item}</li>)}
          </ul>
        </div>
      ))}
      <p style={p}>Konkrete Preise erstellen wir individuell auf Anfrage, abgestimmt auf die jeweilige Nutzergruppe.</p>

      <h2 style={h2}>4. Rollout & Seminare ("Bleib am Dart")</h2>
      <p style={p}>Vor-Ort-Seminare bzw. Präsentationen durch unsere Trainer zur Einführung und Erklärung der IT-Dart-Plattform für Gruppen und Unternehmen — von der ersten Vorstellung bis zur praktischen Einweisung im Ausbildungsalltag. Der Aufwand und damit der Richtpreis richten sich nach Gruppengröße, Dauer und Durchführungsort (vor Ort oder remote) und werden individuell abgestimmt.</p>

      <h2 style={h2}>5. Unternehmens-Services</h2>
      <p style={p}>Auf Basis der bewährten IT-Dart-Architektur erstellen wir maßgeschneiderte Lernplattformen für andere Unternehmen, Fachbereiche oder Gruppen — inklusive cloudbasierter Bereitstellung (Setup und Hosting über Vercel und Supabase) und derselben Sicherheits- und Datenschutzgrundlage wie bei IT-Dart selbst.</p>

      <h2 style={h2}>Kontakt</h2>
      <p style={p}>Für ein individuelles Angebot erreichst du uns unter <a href="mailto:kontakt@it-dart.de" style={{color:C.cy}}>kontakt@it-dart.de</a>.</p>
    </LegalLayout>
  );
}
