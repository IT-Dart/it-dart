import { useState, useEffect } from "react";
import { C, pri, wrap, inner } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { authFetch } from "./lib/authFetch";

// Nur sichtbar, wenn MINOR_CONSENT_ENABLED (src/lib/featureFlags.js) auf
// true steht -- solange nicht scharf geschaltet, hat kein Konto
// needsBirthdateSetup/pendingParentConsent gesetzt und dieser Screen
// erscheint nie. Zwei Zustaende: Geburtsdatum noch nicht hinterlegt, oder
// unter 16 und die Eltern-Bestaetigungs-Mail steht noch aus.
const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit",marginBottom:10};

export default function BirthdateSetupScreen(){
  const {pendingParentConsent}=useAuth();
  const [birthdate,setBirthdate]=useState("");
  const [parentEmail,setParentEmail]=useState("");
  const [needsParentEmail,setNeedsParentEmail]=useState(false);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState(null);
  const [submitted,setSubmitted]=useState(false);
  const [done,setDone]=useState(false); // Volljaehrig/16+: kurze Bestaetigung vor dem Reload, statt stillem Sprung -- siehe PasswordSetupScreen.jsx, gleiches Muster.

  const submit=async(e)=>{
    e.preventDefault();
    if(!birthdate){setMsg({type:"error",text:"Bitte Geburtsdatum eingeben."});return;}
    if(needsParentEmail&&(!parentEmail.trim()||!parentEmail.includes("@"))){
      setMsg({type:"error",text:"Bitte die E-Mail-Adresse eines Erziehungsberechtigten angeben."});
      return;
    }
    setBusy(true);setMsg(null);
    try{
      const r=await authFetch("parent-consent",{action:"submit",birthdate,parentEmail:parentEmail.trim()||undefined});
      if(r.status===401){
        // TEMP-DIAGNOSE 2026-08-07: rohen Antworttext mitloggen/anzeigen, um
        // zwischen Plattform-verify_jwt-Ablehnung und der eigenen "Nicht
        // angemeldet."-Antwort der Function zu unterscheiden -- nach Klaerung
        // wieder auf die schlichte Meldung zurueckbauen.
        const raw=await r.text().catch(()=>"(kein Text)");
        console.error("[BirthdateSetupScreen] 401 raw body:",raw);
        setMsg({type:"error",text:`Deine Sitzung ist abgelaufen. Bitte lade die Seite neu und melde dich erneut an. [Diagnose: ${raw.slice(0,200)}]`});
        setBusy(false);return;
      }
      const d=await r.json();
      if(!r.ok){
        if(d.error?.includes("Erziehungsberechtigten")&&!needsParentEmail){setNeedsParentEmail(true);setBusy(false);return;}
        setMsg({type:"error",text:d.error||"Unerwarteter Fehler."});setBusy(false);return;
      }
      setBusy(false);
      if(d.requiresParentConsent){setSubmitted(true);}
      else setDone(true);
    }catch{
      setBusy(false);
      setMsg({type:"error",text:"Verbindung fehlgeschlagen. Bitte erneut versuchen."});
    }
  };

  useEffect(()=>{
    if(!done)return;
    const t=setTimeout(()=>window.location.reload(),1200);
    return ()=>clearTimeout(t);
  },[done]);

  const resend=async()=>{
    setBusy(true);setMsg(null);
    try{
      const r=await authFetch("parent-consent",{action:"resend"});
      const d=await r.json();
      setBusy(false);
      if(!r.ok){setMsg({type:"error",text:d.error||"Unerwarteter Fehler."});return;}
      setMsg({type:"info",text:"Bestätigungs-Mail wurde erneut verschickt."});
    }catch{
      setBusy(false);
      setMsg({type:"error",text:"Verbindung fehlgeschlagen. Bitte erneut versuchen."});
    }
  };

  if(done)return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>✓</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Danke, gespeichert</h2>
      <p style={{fontSize:14,color:C.t2}}>Du wirst gleich automatisch weitergeleitet...</p>
    </div></div>
  );

  if(pendingParentConsent||submitted)return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>✉️</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Bestätigung durch Erziehungsberechtigte ausstehend</h2>
      <p style={{fontSize:14,color:C.t2,lineHeight:1.6,marginBottom:20}}>Wir haben eine Bestätigungs-Mail an die angegebene E-Mail-Adresse einer erziehungsberechtigten Person geschickt. Der Zugang ist eingeschränkt, bis die Bestätigung erfolgt ist.</p>
      {msg&&<div style={{background:msg.type==="error"?"#450a0a":"#052e16",border:`0.5px solid ${msg.type==="error"?"#ef4444":"#22c55e"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,textAlign:"left"}}>
        <p style={{fontSize:13,color:msg.type==="error"?"#fca5a5":"#86efac",margin:0,lineHeight:1.5}}>{msg.text}</p>
      </div>}
      <button onClick={resend} disabled={busy} style={{...pri,width:"100%",justifyContent:"center",opacity:busy?.6:1,marginBottom:10}}>
        {busy?"Bitte warten...":"Mail erneut senden"}
      </button>
      <button onClick={()=>window.location.reload()} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:13,textDecoration:"underline"}}>
        Ich habe bestätigt — Status prüfen
      </button>
    </div></div>
  );

  return(
    <div style={wrap}><div style={{...inner,paddingTop:60}}>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Geburtsdatum angeben</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:16}}>Bitte gib einmalig dein Geburtsdatum an, um fortzufahren.</p>
      <div style={{background:C.s1,border:`0.5px solid ${C.bl}`,borderRadius:12,padding:"12px 14px",marginBottom:20}}>
        <p style={{fontSize:11,fontWeight:700,color:C.bl,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 6px"}}>ℹ️ Warum wir das brauchen</p>
        <p style={{fontSize:12,color:C.t2,margin:0,lineHeight:1.6}}>Für Online-Dienste gilt ab 16 Jahren eine eigene Einwilligung (Art. 8 DSGVO) — darunter braucht es zusätzlich die Bestätigung einer erziehungsberechtigten Person. Für die Kontoerstellung selbst gilt außerdem: Minderjährige zwischen 7 und 17 Jahren sind nur beschränkt geschäftsfähig (§§ 106 ff. BGB). Wir fragen ausschließlich das Datum ab — keine weiteren Angaben, keine Weitergabe an Dritte.</p>
      </div>
      <form onSubmit={submit}>
        <input type="date" value={birthdate} onChange={e=>setBirthdate(e.target.value)} style={input}/>
        {needsParentEmail&&<input type="email" placeholder="E-Mail einer erziehungsberechtigten Person" value={parentEmail} onChange={e=>setParentEmail(e.target.value)} style={input} autoComplete="email"/>}
        {msg&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <p style={{fontSize:13,color:"#fca5a5",margin:0,lineHeight:1.5}}>{msg.text}</p>
        </div>}
        <button type="submit" disabled={busy} style={{...pri,width:"100%",justifyContent:"center",opacity:busy?.6:1}}>
          {busy?"Bitte warten...":"Weiter →"}
        </button>
      </form>
    </div></div>
  );
}
