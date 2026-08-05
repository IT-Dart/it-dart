import { useState, useEffect } from "react";
import { transitionState } from "./lib/viewTransition";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import PasswordSetupScreen from "./PasswordSetupScreen";
import AgbConsentScreen from "./AgbConsentScreen";
import UsernameScreen from "./UsernameScreen";
import BirthdateSetupScreen from "./BirthdateSetupScreen";
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
  const {recoveryMode,needsPasswordSetup,needsAgbConsent,needsUsernameWelcome,needsBirthdateSetup,pendingParentConsent,kickedOut,dismissKickedOut,authError,dismissAuthError,user,loading}=useAuth();
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
  const [page,setPage]=useState(()=>{
    const mode=params.get("mode");
    if(LEGAL_MODES.includes(mode))return mode;
    return params.has("mode")?"app":"company";
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
    }
  },[loading,user,routed]);

  // Gleicher Grund wie in ITDart.jsx: ohne Router bleibt die Scroll-Position
  // sonst beim Seitenwechsel erhalten statt von oben zu starten.
  useEffect(()=>{window.scrollTo(0,0);},[page]);

  if(einladungLink)return <EinladungScreen link={einladungLink}/>;
  if(parentConsentToken)return <ParentConsentConfirmScreen token={parentConsentToken}/>;
  if(authError)return <AuthErrorScreen authError={authError} onDismiss={()=>{dismissAuthError();changePage("company");}}/>;
  if(recoveryMode)return <ResetPasswordScreen/>;
  if(loading)return null;
  if(kickedOut)return <KickedOutScreen onDismiss={()=>{dismissKickedOut();changePage("company");}}/>;
  if(user&&needsPasswordSetup)return <PasswordSetupScreen/>;
  if(user&&needsAgbConsent)return <AgbConsentScreen onOpenLegal={changePage}/>;
  if(user&&needsUsernameWelcome)return <UsernameScreen mandatory/>;
  if(user&&(needsBirthdateSetup||pendingParentConsent))return <BirthdateSetupScreen/>;
  // Vercel liefert dank vercel.json-Rewrite für jeden unbekannten Pfad diese
  // SPA aus, statt selbst ein 404 zu werfen — die App entscheidet also hier,
  // ob der aufgerufene Pfad überhaupt bekannt ist (die App kennt sonst nur "/",
  // da es keinen Router gibt und alle Screens über view/page-State laufen).
  if(window.location.pathname!=="/")return <NotFoundScreen/>;
  // WARTUNGSMODUS soll nur anonyme Besucher betreffen -- ein bereits
  // angemeldeter Nutzer, der z. B. "Über IT-Dart" aus der App heraus
  // anklickt, muss die echte CompanyScreen sehen, nicht die Baustellenseite
  // mit ihrem eigenen (fälschlich wirkenden) "Hier anmelden"-Link.
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
