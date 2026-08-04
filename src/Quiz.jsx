// Modul-Abschluss-Quiz (Fragen+Antworten gemischt, Ergebnis-Screen inkl.
// Lernnachweis-Download). Ausgelagert aus ITDart.jsx.
import { useState, useEffect } from "react";
import { C, pri, ghost } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { generateLernnachweis, logLernnachweis } from "./lib/lernnachweis";
import { describeError } from "./lib/errorText";

const Quiz=({qs,onDone,title,mid,badgeImages})=>{
  const [i,setI]=useState(0);const [sel,setSel]=useState(null);const [sc,setSc]=useState(0);const [done,setDone]=useState(false);
  const [nachweisBusy,setNachweisBusy]=useState(false);
  const [startedAt,setStartedAt]=useState(()=>new Date());
  const [logErr,setLogErr]=useState(null);
  const [dlErr,setDlErr]=useState(null);
  const {user,isPremium}=useAuth();
  // Einmal pro Durchlauf gemischt (nicht bei jedem Re-Render), damit die
  // Reihenfolge bei jedem Versuch anders ist, aber innerhalb eines
  // Durchlaufs stabil bleibt.
  // Fragen- UND Antwortreihenfolge werden gemischt (nicht nur die Fragen) --
  // sonst steht die richtige Antwort bei jedem Durchlauf an derselben
  // Stelle, was Auswendiglernen der Position statt des Inhalts begünstigt.
  const [shuffled]=useState(()=>{
    const shuffleArr=arr=>[...arr].sort(()=>Math.random()-0.5);
    return shuffleArr(qs).map(item=>{
      const order=shuffleArr(item.o.map((_,idx)=>idx));
      return{...item,o:order.map(idx=>item.o[idx]),c:order.indexOf(item.c)};
    });
  });
  const q=shuffled[i];const ans=sel!==null;
  const pick=idx=>{if(ans)return;setSel(idx);if(idx===q.c)setSc(s=>s+1);};
  const next=()=>{if(i===qs.length-1){setDone(true);return;}setI(x=>x+1);setSel(null);};
  const pct=Math.round((sc/qs.length)*100);
  // jsPDF (~400 KB) lädt sonst erst beim Klick auf "Herunterladen" — hier
  // schon im Hintergrund anstoßen, sobald das Ergebnis steht, damit der
  // eigentliche Download-Klick aus dem (dann bereits warmen) Modul-Cache
  // bedient wird statt spürbar zu verzögern.
  useEffect(()=>{if(done)import("jspdf");},[done]);
  useEffect(()=>{
    if(!done||!user)return;
    logLernnachweis({user,kind:"modul",title,score:sc,total:qs.length,topics:[{name:title,correct:sc,total:qs.length}],startedAt,finishedAt:new Date()})
      ?.then(({error})=>{if(error)setLogErr(describeError(error));});
  },[done]);
  const downloadNachweis=async()=>{
    setNachweisBusy(true);
    setDlErr(null);
    try{
      await generateLernnachweis({user,kind:"modul",title,score:sc,total:qs.length,topics:[{name:title,correct:sc,total:qs.length}],startedAt,finishedAt:new Date(),skipLog:true,moduleIconUrl:badgeImages[mid]});
    }catch(e){
      setDlErr(describeError(e));
    }finally{
      setNachweisBusy(false);
    }
  };
  if(done)return(
    <div style={{textAlign:"center",padding:"10px 0"}}>
      <div style={{fontSize:48,marginBottom:12}}>{pct>=80?"🎯":pct>=60?"👍":"💪"}</div>
      <h3 style={{fontSize:20,fontWeight:700,marginBottom:6}}>{pct>=80?"Sehr gut!":pct>=60?"Gut gemacht!":"Weiter üben!"}</h3>
      <p style={{fontSize:14,color:C.t2,marginBottom:16}}>{sc} von {qs.length} richtig — {pct}%</p>
      <div style={{height:8,background:C.s2,borderRadius:4,overflow:"hidden",marginBottom:20}}>
        <div style={{height:"100%",width:`${pct}%`,background:pct>=80?C.gr:pct>=60?C.am:"#ef4444",borderRadius:4}}/>
      </div>
      {logErr&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"left"}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>Ergebnis konnte nicht in „Meine Statistik" gespeichert werden: {logErr}</p>
      </div>}
      {dlErr&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"left"}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>Lernnachweis konnte nicht erstellt werden: {dlErr}</p>
      </div>}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:user&&pct>=50?12:0}}>
        <button onClick={()=>{setI(0);setSel(null);setSc(0);setDone(false);setStartedAt(new Date());}} style={{...ghost}}>🔄 Nochmal</button>
        <button onClick={onDone} style={{...pri}}>✓ Übersicht</button>
      </div>
      {user&&pct>=50&&(isPremium?<button onClick={downloadNachweis} disabled={nachweisBusy} style={{...ghost,width:"100%",justifyContent:"center",opacity:nachweisBusy?.6:1}}>{nachweisBusy?"Wird erstellt...":"📄 Lernnachweis herunterladen"}</button>:<p style={{fontSize:12,color:C.mu,margin:0}}>🔒 Lernnachweis-Download ist ein Premium-Feature.</p>)}
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,color:C.mu}}>Frage {i+1} / {qs.length}</span><span style={{fontSize:12,color:C.t2}}>{sc} richtig</span></div>
      <div style={{height:3,background:C.s2,borderRadius:2,overflow:"hidden",marginBottom:16}}><div style={{height:"100%",width:`${(i/qs.length)*100}%`,background:`linear-gradient(90deg,${C.bl},${C.cy})`,borderRadius:2}}/></div>
      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}><p style={{fontSize:15,fontWeight:600,lineHeight:1.5,margin:0}}>{q.q}</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {q.o.map((opt,idx)=>{
          let bg=C.s2,bdr=C.bd,col=C.t;
          if(ans){if(idx===q.c){bg="#14532d";bdr="#22c55e";col="#86efac";}else if(idx===sel){bg="#450a0a";bdr="#ef4444";col="#fca5a5";}}
          return(<button key={idx} onClick={()=>pick(idx)} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",width:"100%",background:bg,border:`1px solid ${bdr}`,borderRadius:10,padding:"11px 14px",cursor:ans?"default":"pointer",color:col,fontFamily:"inherit",transition:"all .15s"}}>
            <span style={{width:24,height:24,borderRadius:"50%",background:ans&&idx===q.c?"#22c55e":ans&&idx===sel?"#ef4444":C.bd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0,color:"#fff"}}>{ans&&idx===q.c?"✓":ans&&idx===sel?"✗":["A","B","C","D"][idx]}</span>
            <span style={{fontSize:14,lineHeight:1.4}}>{opt}</span>
          </button>);
        })}
      </div>
      {ans&&<><div style={{background:sel===q.c?"#052e16":"#1c0a0a",border:`0.5px solid ${sel===q.c?"#22c55e":"#ef4444"}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
        <p style={{fontSize:13,color:sel===q.c?"#86efac":"#fca5a5",lineHeight:1.6,margin:0}}><span style={{fontWeight:600}}>{sel===q.c?"✓ Richtig! ":"✗ Leider falsch. "}</span>{q.e}</p>
      </div>
      <button onClick={next} style={{...pri,width:"100%",justifyContent:"center"}}>{i===qs.length-1?"Ergebnis →":"Nächste Frage →"}</button></>}
    </div>
  );
};

export default Quiz;
