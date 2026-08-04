import { useEffect, useState } from "react";
import { C, wrap, inner } from "./lib/theme";

// Oeffentliche Landing-Page fuer den Bestaetigungslink aus der
// parent-consent-Mail (?mode=parent-consent&token=...). Die erziehungs-
// berechtigte Person ist dabei nicht selbst bei IT-Dart angemeldet, daher
// ein direkter, unauthentifizierter Aufruf der Edge Function statt authFetch.
export default function ParentConsentConfirmScreen({token}){
  const [state,setState]=useState("pending"); // "pending" | "ok" | "error"
  const [errorText,setErrorText]=useState("");

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const r=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parent-consent`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({action:"confirm",token}),
        });
        const d=await r.json();
        if(cancelled)return;
        if(!r.ok){setState("error");setErrorText(d.error||"Unerwarteter Fehler.");return;}
        setState("ok");
      }catch{
        if(!cancelled){setState("error");setErrorText("Verbindung fehlgeschlagen. Bitte den Link erneut öffnen.");}
      }
    })();
    return ()=>{cancelled=true;};
  },[token]);

  return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      {state==="pending"&&<p style={{fontSize:14,color:C.t2}}>Bestätigung wird verarbeitet...</p>}
      {state==="ok"&&<>
        <div style={{fontSize:48,marginBottom:12}}>✓</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Bestätigt</h2>
        <p style={{fontSize:14,color:C.t2,lineHeight:1.6}}>Vielen Dank — die Registrierung bei IT-Dart ist damit bestätigt. Diese Seite kann jetzt geschlossen werden.</p>
      </>}
      {state==="error"&&<>
        <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Bestätigung nicht möglich</h2>
        <p style={{fontSize:14,color:C.t2,lineHeight:1.6}}>{errorText}</p>
      </>}
    </div></div>
  );
}
