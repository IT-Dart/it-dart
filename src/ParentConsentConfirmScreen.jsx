import { useState } from "react";
import { C, pri, ghost, wrap, inner } from "./lib/theme";

// Oeffentliche Landing-Page fuer den Bestaetigungslink aus der
// parent-consent-Mail (?mode=parent-consent&token=...). Die erziehungs-
// berechtigte Person ist dabei nicht selbst bei IT-Dart angemeldet, daher
// ein direkter, unauthentifizierter Aufruf der Edge Function statt authFetch.
//
// Nutzerhinweis 2026-08-07: war urspruenglich ein reiner Auto-Confirm ohne
// echten Entscheidungsmoment. Danach auf zwei explizite Checkboxen erweitert
// -- aber direkter Einstieg mit "bitte bestaetigen Sie zwei Punkte", ohne
// dass die erziehungsberechtigte Person ueberhaupt weiss, was IT-Dart ist.
// Jetzt zweistufig: erst eine reine Info-Seite ("Was ist IT-Dart?", Text an
// CompanyScreen.jsx angelehnt), erst danach die eigentliche Entscheidung.
// Der Klick auf "Bestaetigen" uebernimmt zugleich den AGB-Abschluss im
// Namen des Kindes (siehe parent-consent/index.ts), das Kind selbst sieht
// AgbConsentScreen.jsx in diesem Fall nie. Exakter Wortlaut/Altersschwelle
// noch mit Anwalt 1 abzustimmen -- das hier ist die technische Grundlage,
// kein Ersatz fuer die Rechtsprüfung.
export default function ParentConsentConfirmScreen({token}){
  const [step,setStep]=useState("intro"); // "intro" | "form"
  const [agreedToAgb,setAgreedToAgb]=useState(false);
  const [agreedToPrivacy,setAgreedToPrivacy]=useState(false);
  const [state,setState]=useState("idle"); // "idle" | "busy" | "ok" | "error"
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

  if(step==="intro")return(
    <div style={wrap}><div style={{...inner,paddingTop:60}}>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Was ist IT-Dart?</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:14,lineHeight:1.7}}>
        IT-Dart ist die Marke hinter „Bleib am Dart!" — einer digitalen Lernplattform für die Ausbildung zum Fachinformatiker für Systemintegration (FISI). Auszubildende bereiten sich damit strukturiert auf ihre Prüfung vor: Fachmodule, Übungsaufgaben und ein KI-gestützter Lernassistent.
      </p>
      <p style={{fontSize:13,color:C.t2,marginBottom:24,lineHeight:1.7}}>
        Ein Kind oder eine Ihnen anvertraute Person hat sich mit Ihrer E-Mail-Adresse als Kontakt einer erziehungsberechtigten Person registriert. Weil die Person noch minderjährig ist, brauchen wir vor der Freischaltung Ihre Bestätigung — dazu gehören sowohl der Vertragsabschluss (AGB) als auch die Einwilligung in die Datenverarbeitung (Datenschutzerklärung). Auf der nächsten Seite können Sie beides einsehen und bestätigen.
      </p>
      <button onClick={()=>setStep("form")} style={{...pri,width:"100%",justifyContent:"center"}}>
        Weiter →
      </button>
    </div></div>
  );

  return(
    <div style={wrap}><div style={{...inner,paddingTop:60}}>
      <button onClick={()=>setStep("intro")} style={{...ghost,padding:"6px 12px",fontSize:13,marginBottom:20}}>← Zurück</button>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Bestätigung für IT-Dart</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:24,lineHeight:1.6}}>
        Bitte bestätigen Sie die folgenden zwei Punkte, um die Registrierung freizugeben.
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
