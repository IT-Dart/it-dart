import { useState, useEffect } from "react";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import CompanyScreen from "./CompanyScreen";
import { Impressum, Datenschutz, Leistungen } from "./LegalPages";
import { AuthProvider, useAuth } from "./lib/AuthContext";

function AppShell(){
  const {recoveryMode,user,loading}=useAuth();
  // "company" | "app" | "pruefung" | "impressum" | "datenschutz" | "leistungen"
  // it-dart.de/?login überspringt die Unternehmensseite direkt zum Lerntool/Login —
  // Zugang für Bestandskonten ohne aktive Sitzung, ohne dass dafür auf der
  // Unternehmensseite selbst ein Link sichtbar sein muss.
  const [page,setPage]=useState(()=>new URLSearchParams(window.location.search).has("login")?"app":"company");
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
