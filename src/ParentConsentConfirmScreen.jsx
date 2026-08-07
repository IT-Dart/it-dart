import { useState } from "react";
import { C, pri, wrap, inner } from "./lib/theme";

// Oeffentliche Landing-Page fuer den Bestaetigungslink aus der
// parent-consent-Mail (?mode=parent-consent&token=...). Die erziehungs-
// berechtigte Person ist dabei nicht selbst bei IT-Dart angemeldet, daher
// ein direkter, unauthentifizierter Aufruf der Edge Function statt authFetch.
//
// Nutzerhinweis 2026-08-07: war bisher ein reiner Auto-Confirm ohne echten
// Entscheidungsmoment (loeste beim Laden sofort die Bestaetigung aus, ohne
// dass die erziehungsberechtigte Person je etwas gesehen/angeklickt hat).
// Jetzt zwei explizite Checkboxen -- der Klick hier uebernimmt zugleich den
// AGB-Abschluss im Namen des Kindes (siehe parent-consent/index.ts), das
// Kind selbst sieht AgbConsentScreen.jsx in diesem Fall nie. Exakter
// Wortlaut/Altersschwelle noch mit Anwalt 1 abzustimmen -- das hier ist die
// technische Grundlage, kein Ersatz fuer die Rechtsprüfung.
export default function ParentConsentConfirmScreen({token}){
  const [agreedToAgb,setAgreedToAgb]=useState(false);
  const [agreedToPrivacy,setAgreedToPrivacy]=useState(false);
  const [state,setState]=useState("form"); // "form" | "busy" | "ok" | "error"
  const [errorText,setErrorText]=useState("");

  const confirm=async()=>{
    if(!agreedToAgb||!agreedToPrivacy)return;
    setState("busy");
    try{
      const r=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parent-consent`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"confirm",token,agreedToAgb,agreedToPrivacy}),
      });
      const d=await r.json();
      if(!r.ok){setState("error");setErrorText(d.error||"Unerwarteter Fehler.");return;}
      setState("ok");
    }catch{
      setState("error");setErrorText("Verbindung fehlgeschlagen. Bitte den Link erneut öffnen.");
    }
  };

  if(state==="ok")return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>✓</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Bestätigt</h2>
      <p style={{fontSize:14,color:C.t2,lineHeight:1.6}}>Vielen Dank — die Registrierung bei IT-Dart ist damit bestätigt. Diese Seite kann jetzt geschlossen werden.</p>
    </div></div>
  );

  if(state==="error")return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Bestätigung nicht möglich</h2>
      <p style={{fontSize:14,color:C.t2,lineHeight:1.6}}>{errorText}</p>
    </div></div>
  );

  return(
    <div style={wrap}><div style={{...inner,paddingTop:60}}>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Bestätigung für IT-Dart</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:24,lineHeight:1.6}}>
        Ein Kind oder eine Ihnen anvertraute Person hat sich mit Ihrer E-Mail-Adresse als Kontakt einer erziehungsberechtigten Person bei der Lernplattform <strong style={{color:C.t}}>IT-Dart</strong> registriert. Bitte bestätigen Sie die folgenden zwei Punkte, um die Registrierung freizugeben.
      </p>
      <label style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:14,fontSize:13,color:C.t2,lineHeight:1.6,cursor:"pointer"}}>
        <input type="checkbox" checked={agreedToAgb} onChange={e=>setAgreedToAgb(e.target.checked)} style={{marginTop:2}}/>
        <span>Ich habe die <a href="/?mode=agb" target="_blank" rel="noopener" style={{color:C.cy,textDecoration:"underline"}}>AGB</a> gelesen und schließe hiermit im Namen meines Kindes den Nutzungsvertrag mit IT-Dart ab.</span>
      </label>
      <label style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:20,fontSize:13,color:C.t2,lineHeight:1.6,cursor:"pointer"}}>
        <input type="checkbox" checked={agreedToPrivacy} onChange={e=>setAgreedToPrivacy(e.target.checked)} style={{marginTop:2}}/>
        <span>Ich habe die <a href="/?mode=datenschutz" target="_blank" rel="noopener" style={{color:C.cy,textDecoration:"underline"}}>Datenschutzerklärung</a> zur Kenntnis genommen und willige in die dort beschriebene Verarbeitung der Daten ein.</span>
      </label>
      {state==="busy"&&<p style={{fontSize:13,color:C.t2,marginBottom:14}}>Bitte warten...</p>}
      <button onClick={confirm} disabled={!agreedToAgb||!agreedToPrivacy||state==="busy"} style={{...pri,width:"100%",justifyContent:"center",opacity:(!agreedToAgb||!agreedToPrivacy||state==="busy")?.6:1}}>
        Bestätigen →
      </button>
    </div></div>
  );
}
