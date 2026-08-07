import { useState } from "react";
import { C, pri, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";

// Nutzerhinweis 2026-08-07: laeuft als allererstes Gate nach dem Login --
// wer per Einladungs-Mail auf "Konto aktivieren" klickt, landete bisher ohne
// jede Einordnung direkt bei der Geburtsdatum-Abfrage (BirthdateSetupScreen.jsx).
// Diese Seite erklaert einmalig, was IT-Dart ist, bevor irgendein anderes
// Onboarding-Gate (Geburtsdatum/AGB/Passwort/Nutzername) drankommt. Text an
// CompanyScreen.jsx angelehnt, ergaenzt um die zwei Punkte, die vor jeder
// Dateneingabe bekannt sein sollten: KI-Einsatz und kostenpflichtige Pakete.
export default function OnboardingIntroScreen(){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState(null);

  const weiter=async()=>{
    setBusy(true);setMsg(null);
    const { error } = await supabase.rpc("confirm_onboarding_intro_seen");
    setBusy(false);
    if(error){setMsg("Verbindung fehlgeschlagen. Bitte erneut versuchen.");return;}
    window.location.reload();
  };

  return(
    <div style={wrap}><div style={{...inner,paddingTop:60}}>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Willkommen bei IT-Dart</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:20,lineHeight:1.7}}>
        IT-Dart ist die Marke hinter „Bleib am Dart!" — einer digitalen Lernplattform für die Ausbildung zum Fachinformatiker für Systemintegration (FISI). Fachmodule, Übungsaufgaben und ein Rechentrainer helfen bei der strukturierten Prüfungsvorbereitung. Die Inhalte sind am Rahmenlehrplan für den Ausbildungsberuf ausgerichtet — andere IT-Interessierte sind aber ausdrücklich nicht ausgeschlossen.
      </p>
      <div style={{background:C.s1,border:`0.5px solid ${C.bl}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        <p style={{fontSize:11,fontWeight:700,color:C.bl,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 6px"}}>🤖 KI-Einsatz</p>
        <p style={{fontSize:12,color:C.t2,margin:0,lineHeight:1.6}}>An vielen Stellen der Plattform kommt KI zum Einsatz — u. a. im Lern-Chat, beim Mock-Interview und bei der Auswertung deiner Prüfungsvorbereitung. Deine Fragen werden dafür an Anthropic (Claude) übermittelt, aber nicht dauerhaft bei uns gespeichert. Details dazu stehen in der Datenschutzerklärung.</p>
      </div>
      <div style={{background:C.s1,border:`0.5px solid ${C.bl}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        <p style={{fontSize:11,fontWeight:700,color:C.bl,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 6px"}}>⭐ Kostenpflichtige Pakete</p>
        <p style={{fontSize:12,color:C.t2,margin:0,lineHeight:1.6}}>Ein Teil der Inhalte ist kostenlos nutzbar. Für den vollen Funktionsumfang (u. a. alle Module, KI-Mock-Interview, Rechentrainer) gibt es optionale, kostenpflichtige Pakete — nichts davon wird automatisch abgeschlossen, ein Kauf erfordert immer eine bewusste, separate Aktion.</p>
      </div>
      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:11,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 6px"}}>ℹ️ Wie es weitergeht</p>
        <p style={{fontSize:12,color:C.t2,margin:0,lineHeight:1.6}}>Im nächsten Schritt fragen wir kurz dein Geburtsdatum ab (gesetzlich vorgeschrieben, siehe nächste Seite) und bitten dich, unsere <a href="/?mode=agb" target="_blank" rel="noopener" style={{color:C.cy,textDecoration:"underline"}}>AGB</a> und <a href="/?mode=datenschutz" target="_blank" rel="noopener" style={{color:C.cy,textDecoration:"underline"}}>Datenschutzerklärung</a> zu bestätigen.</p>
      </div>
      {msg&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0,lineHeight:1.5}}>{msg}</p>
      </div>}
      <button onClick={weiter} disabled={busy} style={{...pri,width:"100%",justifyContent:"center",opacity:busy?.6:1}}>
        {busy?"Bitte warten...":"Weiter →"}
      </button>
    </div></div>
  );
}
