import { useState, useEffect } from "react";
import { transitionState } from "./lib/viewTransition";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import PasswordSetupScreen from "./PasswordSetupScreen";
import AgbConsentScreen from "./AgbConsentScreen";
import UsernameScreen from "./UsernameScreen";
import BirthdateSetupScreen from "./BirthdateSetupScreen";
import OnboardingIntroScreen from "./OnboardingIntroScreen";
import ParentConsentConfirmScreen from "./ParentConsentConfirmScreen";
import KickedOutScreen from "./KickedOutScreen";
import AuthErrorScreen from "./AuthErrorScreen";
import CompanyScreen from "./CompanyScreen";
import NotFoundScreen from "./NotFoundScreen";
import EinladungScreen from "./EinladungScreen";
import WartungScreen from "./WartungScreen";
import { Impressum, Datenschutz, Leistungen, AGB, TrainerVereinbarung } from "./LegalPages";
import { AuthProvider, useAuth } from "./lib/AuthContext";

// Temporärer Schalter: solange true, sehen anonyme Besucher statt der
// Unternehmensseite eine "Im Aufbau"-Seite (WartungScreen.jsx). Bereits
// eingeloggte Nutzer sind komplett unbetroffen -- sie werden weiter unten
// automatisch direkt zu "app" geroutet, bevor page==="company" je greift.
// Einfach auf false setzen, um wieder auf die normale Unternehmensseite umzuschalten.
const WARTUNGSMODUS=true;

function AppShell(){
  const {recoveryMode,needsPasswordSetup,needsAgbConsent,needsUsernameWelcome,needsBirthdateSetup,pendingParentConsent,needsOnboardingIntro,kickedOut,dismissKickedOut,authError,dismissAuthError,user,loading,profileLoading}=useAuth();
  // "company" | "app" | "pruefung" | "impressum" | "datenschutz" | "leistungen" | "agb"
  // ?mode=login/register kommt vom "Anmelden / Registrieren"-Button auf der
  // Unternehmensseite selbst (CompanyScreen.jsx) sowie von Einladungslinks —
  // ITDart.jsx wertet den genauen mode-Wert dann noch mal selbst aus, hier
  // reicht die Präsenz. Bestandskonten ohne aktive Sitzung landen über die
  // reine Domain automatisch in der App (siehe useEffect unten).
  const params=new URLSearchParams(window.location.search);
  // Direkte Links auf Rechtstexte (z. B. aus E-Mail-Footern) sollen sofort
  // die passende Seite öffnen statt nur generisch in die App zu routen --
  // alle anderen mode-Werte (login/register/einladung/...) verhalten sich
  // unverändert wie zuvor.
  const LEGAL_MODES=["impressum","datenschutz","agb","leistungen","trainer-vereinbarung"];
  // "company" ist erst der endgueltige Default, sobald der Login-Status
  // feststeht (siehe Effekt unten) -- bis dahin "null" (noch unentschieden).
  // Ohne dieses Zwischenstadium wurde beim ersten Render nach jedem harten
  // Neuladen (z. B. window.location.reload() in UsernameScreen.jsx,
  // AgbConsentScreen.jsx, ...) kurz die echte Unternehmensseite gemalt, bevor
  // der Effekt sie auf "app" korrigierte -- ein sichtbarer Flash zwischen
  // Login und Lerntool (Regressions-Fund 2026-08-05).
  const [page,setPage]=useState(()=>{
    const mode=params.get("mode");
    if(LEGAL_MODES.includes(mode))return mode;
    // Waehrend WARTUNGSMODUS soll Registrierung nicht nur unbeworben, sondern
    // hart gesperrt sein -- der direkte Link ?mode=register funktionierte
    // bisher unabhaengig vom Wartungsmodus (realer Fund 2026-08-06). "login"
    // bleibt bewusst unberuehrt, Bestandskonten muessen sich weiter anmelden
    // koennen.
    if(mode==="register"&&WARTUNGSMODUS)return null;
    return params.has("mode")?"app":null;
  });
  // Sanfter Seitenuebergang bei jedem page-Wechsel (To-Do #126) -- geteilter
  // Helper mit ITDart.jsx, siehe lib/viewTransition.js.
  const changePage=(p)=>{transitionState(setPage,p);};
  const [routed,setRouted]=useState(false);

  // Einladungs-Wrapper (siehe EinladungScreen.jsx): der eigentliche
  // Supabase-Magic-Link wird nie direkt geteilt, weil Messenger wie
  // WhatsApp Links serverseitig abrufen, um eine Vorschaukarte zu bauen --
  // bei einem Einmal-Link würde genau dieser automatische Abruf den Token
  // schon verbrauchen, bevor der Empfänger ihn selbst anklickt. Strikt
  // gegen dieses feste Supabase-Präfix validiert, damit `?mode=einladung`
  // niemals als offener Redirector auf beliebige URLs missbraucht werden
  // kann. Ganz oben geprüft, noch vor Auth-Status/Recovery-Mode -- diese
  // Seite ist komplett öffentlich und unabhängig vom Login-Zustand.
  const SUPABASE_VERIFY_PREFIX="https://vukqjpqawzhfvpjjpipp.supabase.co/auth/v1/verify?";
  const einladungLink=params.get("mode")==="einladung"?(()=>{
    const raw=params.get("link");
    return raw&&raw.startsWith(SUPABASE_VERIFY_PREFIX)?raw:null;
  })():null;

  // Bestaetigungslink aus der parent-consent-Mail (siehe
  // BirthdateSetupScreen.jsx) -- oeffentlich, unabhaengig vom Login-Zustand
  // der erziehungsberechtigten Person, daher ebenfalls ganz oben geprueft.
  const parentConsentToken=params.get("mode")==="parent-consent"?params.get("token"):null;

  // Einmalige Entscheidung, sobald die Sitzung geladen ist: bestehende
  // Konten landen wie gewohnt direkt im Lerntool, neue/anonyme Besucher
  // sehen zuerst die Unternehmenspräsentation. Danach volle manuelle
  // Navigation, kein erzwungenes Zurückspringen mehr.
  useEffect(()=>{
    if(!loading&&!routed){
      setRouted(true);
      if(user)changePage("app");
      else if(page===null)changePage("company"); // Default erst jetzt final setzen, siehe Kommentar oben bei useState(page)
    }
  },[loading,user,routed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gleicher Grund wie in ITDart.jsx: ohne Router bleibt die Scroll-Position
  // sonst beim Seitenwechsel erhalten statt von oben zu starten.
  useEffect(()=>{window.scrollTo(0,0);},[page]);

  if(einladungLink)return <EinladungScreen link={einladungLink}/>;
  if(parentConsentToken)return <ParentConsentConfirmScreen token={parentConsentToken}/>;
  if(authError)return <AuthErrorScreen authError={authError} onDismiss={()=>{dismissAuthError();changePage("company");}}/>;
  // Rechtstexte muessen auch waehrend eines noch offenen Onboarding-Gates
  // (AGB/Passwort/Username/Geburtsdatum) erreichbar sein -- sonst fuehrt ein
  // Klick auf "AGB"/"Datenschutzerklaerung" aus AgbConsentScreen.jsx ins
  // Leere, weil die Gate-Pruefungen unten sonst bei jedem Render Vorrang
  // haetten und immer wieder denselben Gate-Screen zeigen wuerden (realer
  // Nutzerbericht 2026-08-06: Links "funktionieren nicht"). Zurueck fuehrt
  // ganz bewusst wieder auf "app"/"company" und damit automatisch zurueck
  // zum noch offenen Gate, nicht am Gate vorbei.
  const legalBackHome=()=>changePage(user?"app":"company");
  if(user&&LEGAL_MODES.includes(page)){
    if(page==="impressum")return <Impressum onClose={legalBackHome}/>;
    if(page==="datenschutz")return <Datenschutz onClose={legalBackHome}/>;
    if(page==="leistungen")return <Leistungen onClose={legalBackHome}/>;
    if(page==="agb")return <AGB onClose={legalBackHome}/>;
    if(page==="trainer-vereinbarung")return <TrainerVereinbarung onClose={legalBackHome}/>;
  }
  // Bewusst VOR recoveryMode/ResetPasswordScreen: ein frisch per Einladung
  // angelegtes Konto soll erst AGB/Datenschutz bestaetigen und danach ein
  // Passwort setzen, nicht umgekehrt (realer Nutzerbericht 2026-08-06). Das
  // dabei durchlaufene, kurze Zeitfenster ohne geladenes profile faellt sonst
  // auf recoveryMode zurueck (needsAgbConsent ist bis dahin false) -- siehe
  // invitePasswordPending/sessionStorage in AuthContext.jsx, das dafuer
  // sorgt, dass ResetPasswordScreen trotz des zwischenzeitlichen Reloads in
  // AgbConsentScreen.jsx danach zuverlaessig noch drankommt.
  //
  // Waehrend recoveryMode noch nicht bekannt ist, ob profile schon geladen
  // ist (session selbst laedt noch, oder profile-Fetch noch unterwegs),
  // NICHTS rendern -- sonst flasht kurz ResetPasswordScreen auf (needsAgbConsent
  // haengt an profile und ist bis dahin faelschlich false), bevor der naechste
  // Render auf AgbConsentScreen umschaltet. Erst wenn wirklich feststeht, ob
  // AGB noch fehlt, wird endgueltig entschieden (realer Nutzerbericht 2026-08-06).
  if(recoveryMode&&(loading||(user&&profileLoading)))return null;
  // Nutzerhinweis 2026-08-07: wer per Einladungs-Mail auf "Konto aktivieren"
  // klickt, landete ohne jede Einordnung direkt bei der Geburtsdatum-Abfrage.
  // Laeuft deshalb vor JEDEM anderen Onboarding-Gate, siehe OnboardingIntroScreen.jsx.
  if(user&&needsOnboardingIntro)return <OnboardingIntroScreen/>;
  // Nutzerhinweis 2026-08-07: die AGB-Checkbox lief bisher IMMER durch den
  // Kontoinhaber selbst -- noch BEVOR das Geburtsdatum ueberhaupt bekannt
  // war. Bei einer minderjaehrigen Person ist das vermutlich nichtig
  // (§§ 106 ff. BGB) -- ein Kind kann keinen wirksamen Vertrag schliessen,
  // nur weil das System seine Volljaehrigkeit noch nicht geprueft hat.
  // Deshalb jetzt VOR der AGB-Pruefung: Alter feststellen, und bei einer
  // noch ausstehenden Eltern-Bestaetigung bleibt AgbConsentScreen fuer das
  // Kind komplett unerreichbar -- der Eltern-Klick in
  // ParentConsentConfirmScreen.jsx uebernimmt den AGB-Abschluss dann direkt
  // mit (setzt agb_consent_given serverseitig, siehe parent-consent/
  // index.ts), needsAgbConsent ist zu dem Zeitpunkt bereits false.
  if(user&&(needsBirthdateSetup||pendingParentConsent))return <BirthdateSetupScreen/>;
  if(user&&needsAgbConsent)return <AgbConsentScreen onOpenLegal={changePage}/>;
  if(recoveryMode)return <ResetPasswordScreen/>;
  if(loading)return null;
  if(kickedOut)return <KickedOutScreen onDismiss={()=>{dismissKickedOut();changePage("company");}}/>;
  if(user&&needsPasswordSetup)return <PasswordSetupScreen/>;
  if(user&&needsUsernameWelcome)return <UsernameScreen mandatory/>;
  // Vercel liefert dank vercel.json-Rewrite für jeden unbekannten Pfad diese
  // SPA aus, statt selbst ein 404 zu werfen — die App entscheidet also hier,
  // ob der aufgerufene Pfad überhaupt bekannt ist (die App kennt sonst nur "/",
  // da es keinen Router gibt und alle Screens über view/page-State laufen).
  if(window.location.pathname!=="/")return <NotFoundScreen/>;
  // WARTUNGSMODUS soll nur anonyme Besucher betreffen -- ein bereits
  // angemeldeter Nutzer, der z. B. "Über IT-Dart" aus der App heraus
  // anklickt, muss die echte CompanyScreen sehen, nicht die Baustellenseite
  // mit ihrem eigenen (fälschlich wirkenden) "Hier anmelden"-Link.
  if(page===null)return null; // Routing-Entscheidung company/app noch nicht getroffen, siehe useState(page) oben
  if(page==="company")return (WARTUNGSMODUS&&!user)?<WartungScreen onOpenLegal={changePage}/>:<CompanyScreen onEnterApp={()=>changePage("app")} onOpenLegal={changePage}/>;
  const backHome=()=>changePage(user?"app":"company");
  if(page==="username")return <UsernameScreen onClose={backHome}/>;
  if(page==="impressum")return <Impressum onClose={backHome}/>;
  if(page==="datenschutz")return <Datenschutz onClose={backHome}/>;
  if(page==="leistungen")return <Leistungen onClose={backHome}/>;
  if(page==="agb")return <AGB onClose={backHome}/>;
  if(page==="trainer-vereinbarung")return <TrainerVereinbarung onClose={backHome}/>;

  return (
    <>
      <div style={{display:page==="pruefung"?"none":"block"}}>
        <ITDart onOpenExam={()=>changePage("pruefung")} onOpenLegal={changePage} wartungsmodus={WARTUNGSMODUS}/>
      </div>
      {page==="pruefung"&&<Pruefung onExit={()=>changePage("app")}/>}
    </>
  );
}

export default function App(){
  return (
    <AuthProvider>
      <AppShell/>
    </AuthProvider>
  );
}
