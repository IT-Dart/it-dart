// KI-Lernassistent-Panel + die beiden mehrstufigen Dialogmodi
// (Mock-Interview, Netzwerk-Diagnose). Ausgelagert aus ITDart.jsx.
import { useState } from "react";
import { C, pri, ghost } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { authFetch } from "./lib/authFetch";

const INTERVIEW_MAX_ROUNDS=8; // muss mit INTERVIEW_MAX_ROUNDS in supabase/functions/ai-chat/index.ts übereinstimmen
const CHAT_MAX_QUESTIONS=10; // pro Thema — nur clientseitig, der eigentliche Kostendeckel ist das serverseitige Stundenlimit

// Beide mehrstufigen Dialogmodi (Mock-Interview, Netzwerk-Diagnose) teilen
// sich dieselbe Verlaufs-/Rundenlogik unten, nur Label/Icon/Texte weichen
// ab — siehe DIALOG_COPY. Neue Modi hier ergänzen, nicht die Mechanik
// duplizieren.
const DIALOG_COPY={
  interview:{icon:"🎤",label:"Mock-Interview",start:"Interview starten",roundNoun:"Runden",overMsg:"Diese Interview-Runde ist abgeschlossen. Verlasse das Thema und öffne es erneut, um eine neue Runde zu starten.",starterText:"Bitte beginne das Interview mit deiner ersten Frage.",startingText:"Interview wird vorbereitet …"},
  diagnose:{icon:"🛰️",label:"Diagnose-Dialog",start:"Diagnose starten",roundNoun:"Runden",overMsg:"Diese Diagnose-Runde ist abgeschlossen. Verlasse das Thema und öffne es erneut, um eine neue Runde zu starten.",starterText:"Bitte beschreibe die erste Störungsmeldung und beginne die Diagnose.",startingText:"Troubleshooting-System wird gestartet …"},
};

// Gemeinsamer "HUD"-Look für KI-Lernassistent und Dialogmodi (bewusst per
// <style>-Tag statt Inline-Style, da CSS-Keyframes/Media-Queries mit
// reinen Style-Objekten nicht abbildbar sind — kein CSS-Framework, kein
// styled-components, nur natives CSS). Respektiert prefers-reduced-motion
// wie schon ParticleBackground auf der Unternehmensseite.
const AI_PANEL_CSS=`
@keyframes aiGlowPulse{0%,100%{box-shadow:0 0 0 1px rgba(56,189,248,.35),0 0 16px rgba(56,189,248,.18),inset 0 0 24px rgba(37,99,235,.06)}50%{box-shadow:0 0 0 1px rgba(56,189,248,.65),0 0 30px rgba(56,189,248,.4),inset 0 0 24px rgba(37,99,235,.12)}}
@keyframes aiOrbPulse{0%,100%{box-shadow:0 0 0 0 rgba(56,189,248,.55)}50%{box-shadow:0 0 0 6px rgba(56,189,248,0)}}
@keyframes aiDot{0%,80%,100%{opacity:.25;transform:scale(.85)}40%{opacity:1;transform:scale(1)}}
.ai-panel{animation:aiGlowPulse 3.2s ease-in-out infinite}
.ai-orb{animation:aiOrbPulse 2s ease-in-out infinite}
.ai-dot{animation:aiDot 1.1s ease-in-out infinite}
.ai-dot:nth-child(2){animation-delay:.15s}
.ai-dot:nth-child(3){animation-delay:.3s}
@media (prefers-reduced-motion: reduce){.ai-panel,.ai-orb,.ai-dot{animation:none}}
`;
const aiPanelStyle={position:"relative",background:"linear-gradient(165deg, rgba(37,99,235,.10), rgba(15,22,35,0) 65%)",border:`1px solid ${C.bl}`,borderRadius:14,padding:"16px",overflow:"hidden"};
const AIOrb=({icon})=><span className="ai-orb" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%, #38bdf8, #1d4ed8)",fontSize:13,flexShrink:0}}>{icon}</span>;
// Anthropic-Nutzungsrichtlinie verlangt fuer jeden konsumentenseitigen Chat
// eine Offenlegung "interagiert mit KI, nicht mit Mensch" mindestens zu
// Beginn jeder Sitzung — Branding (Icon/Label) allein reicht dafuer nicht,
// es braucht einen expliziten Satz.
const AIDisclosure=({extra})=>(
  <p style={{fontSize:11,color:C.mu,margin:"0 0 10px",fontStyle:"italic"}}>Du sprichst mit einer KI (Anthropic Claude), keiner echten Person.{extra?` ${extra}`:""}</p>
);

const AIThinking=({text})=>(
  <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 2px"}}>
    <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><span key={i} className="ai-dot" style={{width:6,height:6,borderRadius:"50%",background:C.cy,display:"inline-block"}}/>)}</div>
    <span style={{fontSize:12,color:C.cy,letterSpacing:".02em"}}>{text}</span>
  </div>
);

const AIChat=({ctx,q1,q2,a1,a2,moduleId,dialogMode})=>{
  const [q,setQ]=useState("");const [a,setA]=useState("");
  const [history,setHistory]=useState([]); // nur in Dialogmodi genutzt: [{role,content}]
  const [busy,setBusy]=useState(false);
  const [askCount,setAskCount]=useState(0); // nur im Frag-nach-Modus genutzt
  const dialog=dialogMode?DIALOG_COPY[dialogMode]:null;

  const call=async(question,priorHistory)=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)return{error:"Bitte melde dich an, um die KI zu nutzen."};
    const r=await authFetch("ai-chat",dialog?{ctx,question,moduleId,history:priorHistory,mode:dialogMode}:{ctx,question,moduleId});
    const d=await r.json();
    if(!r.ok)return{error:d.error||`Fehler (${r.status}).`};
    return{answer:d.answer||"Keine Antwort."};
  };

  const askLimitReached=askCount>=CHAT_MAX_QUESTIONS;
  const ask=async(question)=>{
    if(!question.trim()||askLimitReached)return;
    setAskCount(c=>c+1);
    setA("Wird geladen...");
    try{const res=await call(question);setA(res.error||res.answer);}
    catch(e){setA("Verbindung fehlgeschlagen.");}
  };

  // Anthropic verlangt strikt abwechselnde user/assistant-Rollen, beginnend
  // mit user. Der Auslöser-Text für die erste Frage wird deshalb selbst als
  // echter user-Turn gespeichert (sonst würde der zweite Aufruf mit einem
  // assistant-Turn beginnen und die API mit einem Fehler ablehnen) — beim
  // Rendern wird nur dieser eine, unsichtbare Auslöser-Turn ausgeblendet.
  const dialogRounds=history.filter(m=>m.role==="assistant").length;
  const dialogOver=dialogRounds>=INTERVIEW_MAX_ROUNDS;
  const dialogStep=async(userText)=>{
    if(dialogOver)return;
    const turnText=userText||dialog.starterText;
    const priorHistory=history;
    setHistory(h=>[...h,{role:"user",content:turnText}]);
    setQ("");setBusy(true);
    try{
      const res=await call(turnText,priorHistory);
      setHistory(h=>[...h,{role:"assistant",content:res.error||res.answer}]);
    }catch(e){setHistory(h=>[...h,{role:"assistant",content:"Verbindung fehlgeschlagen."}]);}
    setBusy(false);
  };

  if(dialog)return(
    <div className="ai-panel" style={aiPanelStyle}>
      <style>{AI_PANEL_CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <AIOrb icon={dialog.icon}/>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:C.t,margin:0,textShadow:"0 0 12px rgba(56,189,248,.5)"}}>{dialog.label}</p>
        {history.length>0&&<span style={{marginLeft:"auto",fontSize:11,color:C.cy,border:`0.5px solid ${C.bl}`,borderRadius:20,padding:"2px 9px"}}>{Math.min(dialogRounds,INTERVIEW_MAX_ROUNDS)} / {INTERVIEW_MAX_ROUNDS} {dialog.roundNoun}</span>}
      </div>
      <AIDisclosure extra={dialogMode==="interview"?"Übungssimulation, keine reale Bewertung.":undefined}/>
      {history.length===0?(
        busy?<AIThinking text={dialog.startingText}/>:
        <button onClick={()=>dialogStep(null)} style={{...pri,width:"100%",justifyContent:"center",boxShadow:"0 0 22px rgba(37,99,235,.55)"}}>{dialog.start}</button>
      ):(<>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          {history.slice(1).map((m,i)=>(
            <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"88%",background:m.role==="user"?C.s2:"linear-gradient(135deg, #0f2744, #0b1c33)",border:`0.5px solid ${m.role==="user"?C.bd:"rgba(56,189,248,.5)"}`,borderRadius:10,padding:"9px 12px",boxShadow:m.role==="user"?"none":"0 0 14px rgba(56,189,248,.12)"}}>
              <p style={{fontSize:13,color:m.role==="user"?C.t:"#93c5fd",lineHeight:1.6,margin:0}}>{m.content}</p>
            </div>
          ))}
          {busy&&<AIThinking text={dialogRounds===0?dialog.startingText:"Antwort wird analysiert …"}/>}
        </div>
        {dialogOver?(
          <p style={{fontSize:12,color:C.mu,margin:0}}>{dialog.overMsg}</p>
        ):(
          <div style={{display:"flex",gap:8}}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!busy&&dialogStep(q)} placeholder="Deine Antwort..." disabled={busy} style={{flex:1,background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>dialogStep(q)} disabled={busy||!q.trim()} style={{...pri,padding:"10px 14px",flexShrink:0,opacity:busy||!q.trim()?.6:1,boxShadow:busy||!q.trim()?"none":"0 0 16px rgba(37,99,235,.5)"}}>→</button>
          </div>
        )}
      </>)}
    </div>
  );

  const chatLoading=a==="Wird geladen...";
  return(
    <div className="ai-panel" style={aiPanelStyle}>
      <style>{AI_PANEL_CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <AIOrb icon="🤖"/>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:C.t,margin:0,textShadow:"0 0 12px rgba(56,189,248,.5)"}}>KI-Lernassistent</p>
        {askCount>0&&<span style={{marginLeft:"auto",fontSize:11,color:C.cy,border:`0.5px solid ${C.bl}`,borderRadius:20,padding:"2px 9px"}}>{Math.min(askCount,CHAT_MAX_QUESTIONS)} / {CHAT_MAX_QUESTIONS} Fragen</span>}
      </div>
      <AIDisclosure/>
      {askLimitReached?(
        <p style={{fontSize:12,color:C.mu,margin:0}}>Maximale Anzahl an Fragen für dieses Thema erreicht. Verlasse das Thema und öffne es erneut, um weiter zu fragen.</p>
      ):(<>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {[[q1,a1],[q2,a2]].map(([qi,ai],i)=>(<button key={i} onClick={()=>{setQ(qi);ai?setA(ai):ask(qi);}} style={{...ghost,textAlign:"left",fontSize:13,padding:"8px 12px",width:"100%"}}>{qi}</button>))}
        </div>
        <p style={{fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:C.cy,margin:"2px 0 6px"}}>✏️ Dein Vorteil: frag alles zum Thema</p>
        <div style={{display:"flex",gap:8}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)} placeholder="Eigene Frage..." style={{flex:1,background:C.s2,border:`1px solid ${C.cy}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxShadow:"0 0 12px rgba(56,189,248,.25)"}}/>
          <button onClick={()=>ask(q)} style={{...pri,padding:"10px 14px",flexShrink:0,boxShadow:"0 0 16px rgba(37,99,235,.5)"}}>→</button>
        </div>
      </>)}
      {chatLoading&&<div style={{marginTop:10}}><AIThinking text="Antwort wird analysiert …"/></div>}
      {a&&!chatLoading&&<div style={{marginTop:10,background:"linear-gradient(135deg, #0f2744, #0b1c33)",border:"0.5px solid rgba(56,189,248,.5)",borderRadius:10,padding:12,boxShadow:"0 0 14px rgba(56,189,248,.12)"}}><p style={{fontSize:14,color:"#93c5fd",lineHeight:1.6,margin:0}}>{a}</p></div>}
    </div>
  );
};

export default AIChat;
