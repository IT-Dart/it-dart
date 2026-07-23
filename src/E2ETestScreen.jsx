import { useEffect, useRef, useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";
import { E2E_SUITES } from "./lib/e2eSuites";
import { generateE2EReport } from "./lib/e2eReport";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const STATUS_LABEL={queued:"WARTET",running:"LÄUFT",success:"OK",failure:"FEHLER",error:"FEHLER"};
const STATUS_COLOR={queued:C.mu,running:C.cy,success:C.gr,failure:C.co,error:C.co};
const IN_PROGRESS=new Set(["queued","running"]);

// Fällt ein Lauf deutlich länger auf "queued"/"running" hängen als üblich,
// ist die Rückmeldung von GitHub Actions höchstwahrscheinlich gescheitert
// (real aufgetreten: eine deaktivierte JWT-Prüfung ließ mehrere Läufe
// unbemerkt für immer auf "queued" stehen). Ohne diese Kennzeichnung fällt
// das nur auf, wenn jemand zusätzlich manuell in GitHub Actions nachschaut.
// Schwelle = das Dreifache der echten Durchschnittsdauer (siehe
// avgDurationMs unten), mit Mindest-/Höchstwert, solange noch wenig
// Datenbasis vorhanden ist.
const DEFAULT_STALE_MS=20*60*1000;
const MIN_STALE_MS=10*60*1000;
const MAX_STALE_MS=30*60*1000;

const fmtDateTime=(iso)=>iso?new Date(iso).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
const fmtDuration=(ms)=>{
  const totalSec=Math.max(0,Math.round(ms/1000));
  const min=Math.floor(totalSec/60);
  const sec=totalSec%60;
  return min>0?`${min} Min. ${sec} Sek.`:`${sec} Sek.`;
};

export default function E2ETestScreen({onClose}){
  const [runs,setRuns]=useState(null); // null = lädt
  const [err,setErr]=useState(null);
  const [suite,setSuite]=useState(E2E_SUITES[0]?.key||"full");
  const [triggerBusy,setTriggerBusy]=useState(false);
  const [expandedId,setExpandedId]=useState(null);
  const [pdfBusyId,setPdfBusyId]=useState(null);
  const pollRef=useRef(null);

  const loadRuns=async()=>{
    const {data,error}=await supabase.from("e2e_runs").select("*").order("created_at",{ascending:false}).limit(50);
    if(error){setErr(describeError(error));setRuns([]);return;}
    setRuns(data||[]);
  };

  useEffect(()=>{loadRuns();},[]);

  // Solange ein Lauf noch "queued"/"running" ist, alle 5s neu laden — kein
  // neues Paket nötig, einfacher setInterval reicht für diese Frequenz.
  useEffect(()=>{
    const hasPending=runs?.some(r=>IN_PROGRESS.has(r.status));
    if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null;}
    if(hasPending){
      pollRef.current=setInterval(loadRuns,5000);
    }
    return ()=>{if(pollRef.current)clearInterval(pollRef.current);};
  },[runs]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRun=async()=>{
    setTriggerBusy(true);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/e2e-trigger-run`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({suite}),
      });
      const d=await res.json();
      if(!res.ok){setErr(d.error||"Testlauf konnte nicht gestartet werden.");setTriggerBusy(false);return;}
      await loadRuns();
    }catch(e){
      setErr(describeError(e));
    }
    setTriggerBusy(false);
  };

  const downloadPdf=async(run)=>{
    setPdfBusyId(run.id);
    try{
      await generateE2EReport(run);
    }catch(e){
      setErr(describeError(e));
    }
    setPdfBusyId(null);
  };

  // Durchschnittliche Dauer aus echten, vollständig durchgelaufenen Läufen —
  // bewusst nur "success"/"failure" (die Pipeline ist tatsächlich einmal
  // komplett durchgelaufen), nicht "error": das schließt sowohl früh am
  // Trigger gescheiterte Versuche als auch manuell per SQL zurückgesetzte
  // Karteileichen aus, deren "Dauer" nichts mit einer echten Laufzeit zu tun
  // hätte und den Schnitt sonst stark verzerren würde.
  const completedDurationsMs=(runs||[])
    .filter(r=>(r.status==="success"||r.status==="failure")&&r.finished_at)
    .map(r=>new Date(r.finished_at).getTime()-new Date(r.created_at).getTime())
    .filter(ms=>ms>0);
  const avgDurationMs=completedDurationsMs.length
    ?completedDurationsMs.reduce((a,b)=>a+b,0)/completedDurationsMs.length
    :null;
  const staleMs=avgDurationMs
    ?Math.min(Math.max(avgDurationMs*3,MIN_STALE_MS),MAX_STALE_MS)
    :DEFAULT_STALE_MS;
  const isStale=(r)=>IN_PROGRESS.has(r.status)&&(Date.now()-new Date(r.created_at).getTime())>staleMs;

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>🧪 E2E-Tests</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Neuen Testlauf starten</p>
        <p style={{fontSize:12,color:C.mu,marginBottom:10,lineHeight:1.5}}>Führt echte Browser-Tests über GitHub Actions gegen die Live-App aus — inklusive echter Logins mit den hinterlegten Testkonten. {avgDurationMs?`Ein Lauf dauert im Schnitt etwa ${fmtDuration(avgDurationMs)} (basierend auf den letzten abgeschlossenen Läufen).`:"Ein Lauf dauert typischerweise einige Minuten."}</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <select value={suite} onChange={e=>setSuite(e.target.value)} style={{...input,flex:1,minWidth:220}}>
            {E2E_SUITES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={startRun} disabled={triggerBusy} style={{...pri,flexShrink:0,opacity:triggerBusy?.6:1}}>{triggerBusy?"...":"▶ Testlauf starten"}</button>
        </div>
      </div>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Bisherige Läufe</p>
      {runs===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Wird geladen...</p>}
      {runs?.length===0&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Noch keine Testläufe. Starte oben den ersten.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {runs?.map(r=>{
          const open=expandedId===r.id;
          const label=E2E_SUITES.find(s=>s.key===r.suite)?.label||r.suite;
          return(
            <div key={r.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
              <button onClick={()=>setExpandedId(open?null:r.id)} style={{background:"none",border:"none",padding:0,cursor:"pointer",width:"100%",textAlign:"left",fontFamily:ff,color:"inherit"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,fontWeight:600}}>Lauf #{r.id} · {label}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:600,background:C.s2,color:isStale(r)?C.co:(STATUS_COLOR[r.status]||C.mu),whiteSpace:"nowrap"}}>{isStale(r)?"WARTET (ungewöhnlich lange)":(STATUS_LABEL[r.status]||r.status)}</span>
                </div>
                <p style={{fontSize:11,color:C.mu,margin:"4px 0 0"}}>
                  {IN_PROGRESS.has(r.status)
                    ?`Läuft seit ${fmtDuration(Date.now()-new Date(r.created_at).getTime())}${avgDurationMs?` (Ø sonst ${fmtDuration(avgDurationMs)})`:""}`
                    :`Gestartet ${fmtDateTime(r.created_at)}${r.finished_at?` · Abgeschlossen ${fmtDateTime(r.finished_at)}`:""}`}
                </p>
              </button>
              {open&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.bd}`}}>
                {isStale(r)&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:10}}>Dieser Lauf hat seit über {fmtDuration(staleMs)} keine Rückmeldung erhalten — deutlich länger als der übliche Schnitt{avgDurationMs?` von ${fmtDuration(avgDurationMs)}`:""} — und ist vermutlich fehlgeschlagen. GitHub-Actions-Log des Laufs prüfen; der Status lässt sich bei Bedarf auch direkt per SQL korrigieren (siehe dokumentation/13_SQL_Admin_Notfallreferenz, Abschnitt 6).</p>}
                {r.error_text&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:10}}>{r.error_text}</p>}
                {r.report?.summary&&<p style={{fontSize:13,color:C.t2,marginBottom:10}}>{r.report.summary.passed??0} von {r.report.summary.total??0} Prüfungen bestanden ({r.report.summary.failed??0} fehlgeschlagen).</p>}
                {Array.isArray(r.report?.findings)&&r.report.findings.length>0&&<div style={{marginBottom:10}}>
                  <p style={{fontSize:11,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".04em",margin:"0 0 6px"}}>Gefundene Punkte</p>
                  {r.report.findings.map(f=>(
                    <p key={f.id} style={{fontSize:12,color:C.t2,margin:"0 0 4px"}}>· {f.symptom}</p>
                  ))}
                </div>}
                {Array.isArray(r.report?.results_by_role)&&r.report.results_by_role.length>0&&<div style={{marginBottom:10}}>
                  <p style={{fontSize:11,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".04em",margin:"0 0 6px"}}>Nach Rolle</p>
                  {r.report.results_by_role.map((role,i)=>(
                    <p key={i} style={{fontSize:12,color:C.t2,margin:"0 0 4px"}}>· {role.role}: {role.passed} bestanden, {role.failed} fehlgeschlagen</p>
                  ))}
                </div>}
                {r.gh_workflow_url&&<a href={r.gh_workflow_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.cy,display:"block",marginBottom:10}}>GitHub-Actions-Lauf ansehen ↗</a>}
                {r.report&&<button onClick={()=>downloadPdf(r)} disabled={pdfBusyId===r.id} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:pdfBusyId===r.id?.6:1}}>
                  {pdfBusyId===r.id?"Wird erstellt...":"📄 Als PDF herunterladen"}
                </button>}
              </div>}
            </div>
          );
        })}
      </div>
    </div></div>
  );
}
