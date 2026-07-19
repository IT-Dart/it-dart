import { useState } from "react";
import ITDart from "./ITDart";
import Pruefung from "./Pruefung";
import ResetPasswordScreen from "./ResetPasswordScreen";
import { AuthProvider, useAuth } from "./lib/AuthContext";

function AppShell(){
  const {recoveryMode}=useAuth();
  const [page,setPage]=useState("app"); // "app" | "pruefung"

  if(recoveryMode)return <ResetPasswordScreen/>;

  return (
    <>
      <div style={{display:page==="pruefung"?"none":"block"}}>
        <ITDart onOpenExam={()=>setPage("pruefung")}/>
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
