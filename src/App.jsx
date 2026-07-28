import { useState, useEffect } from "react";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import CompanyScreen from "./CompanyScreen";
import { Impressum, Datenschutz, Leistungen, AGB } from "./LegalPages";
import { AuthProvider, useAuth } from "./lib/AuthContext";

function AppShell(){
  const {recoveryMode,user,loading}=useAuth();
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

  if(recoveryMode)return <ResetPasswordScreen/>;
  if(loading)return null;
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
