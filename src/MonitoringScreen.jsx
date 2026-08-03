import { useEffect, useState } from "react";
import { C, ghost, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";

export default function MonitoringScreen({onClose}){
  const [checks,setChecks]=useState(null); // null=lädt, [] = keine Daten
  const [overview,setOverview]=useState(null);
  const [cspReports,setCspReports]=useState(null);

  const load=async()=>{
    const {data,error}=await supabase.from("monitoring_checks").select("*").order("checked_at",{ascending:false}).limit(150);
    if(error){console.error("[MonitoringScreen] load checks failed:",error.message);setChecks([]);}
    else setChecks(data||[]);
    const {data:ov,error:ovErr}=await supabase.rpc("get_monitoring_overview");
    if(ovErr){console.error("[MonitoringScreen] get_monitoring_overview failed:",ovErr.message);}
    else setOverview(ov?.[0]||null);
    const {data:csp,error:cspErr}=await supabase.from("csp_reports").select("*").order("received_at",{ascending:false}).limit(20);
    if(cspErr){console.error("[MonitoringScreen] load csp_reports failed:",cspErr.message);setCspReports([]);}
    else setCspReports(csp||[]);
  };
  useEffect(()=>{load();},[]);

  const TARGET_LABELS={"it-dart.de":"Hauptseite it-dart.de","edge-function:ai-chat":"Edge Function: ai-chat","edge-function:claim-session":"Edge Function: claim-session"};
  const targets=[...new Set((checks||[]).map(c=>c.target))];
  const statsFor=(target)=>{
    const forTarget=(checks||[]).filter(c=>c.target===target);
    const last24h=forTarget.filter(c=>Date.now()-new Date(c.checked_at).getTime()<24*60*60*1000);
    const uptimePct=last24h.length?Math.round(last24h.filter(c=>c.ok).length/last24h.length*100):null;
    return {checks:forTarget,last24h,uptimePct,latest:forTarget[0]};
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>🩺 Monitoring</span>
        <button onClick={load} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>↻ Aktualisieren</button>
        <button onClick={onClose} style={{...ghost,fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {checks===null&&<div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}><p style={{fontSize:12,color:C.mu,margin:0}}>Lädt…</p></div>}
      {checks?.length===0&&<div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}><p style={{fontSize:12,color:C.mu,margin:0}}>Noch keine Checks — der erste Cron-Lauf steht noch aus (läuft alle 5 Minuten).</p></div>}
      {targets.map(target=>{
        const {checks:tChecks,last24h,uptimePct,latest}=statsFor(target);
        return(
          <div key={target} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
            <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>{TARGET_LABELS[target]||target} (alle 5 Minuten geprüft)</p>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:26,fontWeight:700,color:uptimePct===null?C.t:uptimePct>=99?"#86efac":uptimePct>=95?"#fbbf24":"#fca5a5"}}>{uptimePct===null?"—":`${uptimePct}%`}</div>
                <div style={{fontSize:11,color:C.mu}}>Uptime (24h, {last24h.length} Checks)</div>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:latest?.ok?"#86efac":"#fca5a5"}}>{latest?.ok?"🟢 Erreichbar":"🔴 Nicht erreichbar"}</div>
                <div style={{fontSize:11,color:C.mu}}>Letzter Check: {new Date(latest.checked_at).toLocaleString("de-DE")}{latest?.response_time_ms!=null&&` · ${latest.response_time_ms}ms`}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
              {[...tChecks].reverse().map(c=>(
                <div key={c.id} title={`${new Date(c.checked_at).toLocaleString("de-DE")} — ${c.ok?`OK (${c.status_code})`:c.error||"Fehler"}`} style={{width:8,height:20,borderRadius:2,background:c.ok?"#22c55e":"#ef4444"}}/>
              ))}
            </div>
          </div>
        );
      })}
      {targets.length>0&&<p style={{fontSize:11,color:C.mu,marginTop:-16,marginBottom:24}}>Jeder Balken ein Check, älteste links. Zum Detail überfahren. Bei den Edge Functions gilt ein 401 als gesund (das ist die erwartete Antwort auf einen Ping ohne Anmeldedaten), erst ein 5xx-Fehler zählt als Ausfall.</p>}

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Datenbank</p>
        {overview===null&&<p style={{fontSize:12,color:C.mu,margin:0}}>Lädt…</p>}
        {overview&&<p style={{fontSize:13,color:C.t,margin:0}}>Größe: <strong>{overview.db_size_pretty}</strong></p>}
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>CSP-Verstöße (letzte 20)</p>
        {cspReports===null&&<p style={{fontSize:12,color:C.mu,margin:0}}>Lädt…</p>}
        {cspReports?.length===0&&<p style={{fontSize:12,color:C.mu,margin:0}}>Keine Verstöße gemeldet.</p>}
        {cspReports&&cspReports.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cspReports.map(r=>(
              <div key={r.id} style={{fontSize:11,color:C.t,borderBottom:`0.5px solid ${C.bd}`,paddingBottom:6}}>
                <div><strong>{r.violated_directive||"?"}</strong> blockiert <span style={{color:C.mu}}>{r.blocked_uri||"—"}</span></div>
                <div style={{color:C.mu}}>{new Date(r.received_at).toLocaleString("de-DE")} · {r.document_uri||"—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Noch nicht enthalten</p>
        <p style={{fontSize:12,color:C.mu,margin:0,lineHeight:1.7}}>Vercel-Traffic/Bandbreite und eine externe, von uns unabhängige Alarmierung (z. B. UptimeRobot) sind bewusst als spätere Erweiterung zurückgestellt — siehe To-Do #1.</p>
      </div>
    </div></div>
  );
}
