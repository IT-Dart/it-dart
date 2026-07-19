import { useState } from "react";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import { Impressum, Datenschutz } from "./LegalPages";
import { AuthProvider, useAuth } from "./lib/AuthContext";

function AppShell(){
  const {recoveryMode}=useAuth();
  const [page,setPage]=useState("app"); // "app" | "pruefung" | "impressum" | "datenschutz"

  if(recoveryMode)return <ResetPasswordScreen/>;
  if(page==="impressum")return <Impressum onClose={()=>setPage("app")}/>;
  if(page==="datenschutz")return <Datenschutz onClose={()=>setPage("app")}/>;

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
