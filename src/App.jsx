import { useState, useEffect } from "react";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import PasswordSetupScreen from "./PasswordSetupScreen";
import CompanyScreen from "./CompanyScreen";
import NotFoundScreen from "./NotFoundScreen";
import { Impressum, Datenschutz, Leistungen, AGB } from "./LegalPages";
import { AuthProvider, useAuth } from "./lib/AuthContext";

function AppShell(){
  const {recoveryMode,needsPasswordSetup,user,loading}=useAuth();
  // "company" | "app" | "pruefung" | "impressum" | "datenschutz" | "leistungen" | "agb"
  // ?mode=login/register kommt vom "Anmelden / Registrieren"-Button auf der
  // Unternehmensseite selbst (CompanyScreen.jsx) sowie von Einladungslinks —
  // ITDart.jsx wertet den genauen mode-Wert dann noch mal selbst aus, hier
  // reicht die Präsenz. Bestandskonten ohne aktive Sitzung landen über die
  // reine Domain automatisch in der App (siehe useEffect unten).
  const params=new URLSearchParams(window.location.search);
  const [page,setPage]=useState(()=>params.has("mode")?"app":"company");
  const [routed,setRouted]=useState(false);

  // Einmalige Entscheidung, sobald die Sitzung geladen ist: bestehende
  // Konten landen wie gewohnt direkt im Lerntool, neue/anonyme Besucher
  // sehen zuerst die Unternehmenspräsentation. Danach volle manuelle
  // Navigation, kein erzwungenes Zurückspringen mehr.
  useEffect(()=>{
    if(!loading&&!routed){
      setRouted(true);
      if(user)setPage("app");
    }
  },[loading,user,routed]);

  // Gleicher Grund wie in ITDart.jsx: ohne Router bleibt die Scroll-Position
  // sonst beim Seitenwechsel erhalten statt von oben zu starten.
  useEffect(()=>{window.scrollTo(0,0);},[page]);

  if(recoveryMode)return <ResetPasswordScreen/>;
  if(loading)return null;
  if(user&&needsPasswordSetup)return <PasswordSetupScreen/>;
  // Vercel liefert dank vercel.json-Rewrite für jeden unbekannten Pfad diese
  // SPA aus, statt selbst ein 404 zu werfen — die App entscheidet also hier,
  // ob der aufgerufene Pfad überhaupt bekannt ist (die App kennt sonst nur "/",
  // da es keinen Router gibt und alle Screens über view/page-State laufen).
  if(window.location.pathname!=="/")return <NotFoundScreen/>;
  if(page==="company")return <CompanyScreen onEnterApp={()=>setPage("app")} onOpenLegal={setPage}/>;
  const backHome=()=>setPage(user?"app":"company");
  if(page==="impressum")return <Impressum onClose={backHome}/>;
  if(page==="datenschutz")return <Datenschutz onClose={backHome}/>;
  if(page==="leistungen")return <Leistungen onClose={backHome}/>;
  if(page==="agb")return <AGB onClose={backHome}/>;

  return (
    <>
      <div style={{display:page==="pruefung"?"none":"block"}}>
        <ITDart onOpenExam={()=>setPage("pruefung")} onOpenLegal={setPage}/>
      </div>
      {page==="pruefung"&&<Pruefung onExit={()=>setPage("app")}/>}
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
