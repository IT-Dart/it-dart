import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";
import { generateWebsiteCheckReport } from "./lib/websiteCheckReport";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const STATUS_LABEL={OK:"OK",WARN:"HINWEIS",FEHLER:"FEHLER",success:"OK",error:"FEHLER"};
const STATUS_COLOR={OK:C.gr,WARN:C.am,FEHLER:C.co,success:C.gr,error:C.co};

const fmtDateTime=(iso)=>iso?new Date(iso).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";

export default function WebsiteCheckScreen({onClose}){
  const [checks,setChecks]=useState(null); // null = lädt
  const [err,setErr]=useState(null);
  const [url,setUrl]=useState("");
  const [checkBusy,setCheckBusy]=useState(false);
  const [expandedId,setExpandedId]=useState(null);
  const [pdfBusyId,setPdfBusyId]=useState(null);
  const [deleteBusyId,setDeleteBusyId]=useState(null);

  const loadChecks=async()=>{
    const {data,error}=await supabase.from("website_checks").select("*").order("created_at",{ascending:false}).limit(50);
    if(error){setErr(describeError(error));setChecks([]);return;}
    setChecks(data||[]);
  };

  useEffect(()=>{loadChecks();},[]);

  const runCheck=async()=>{
    if(!url.trim())return;
    setCheckBusy(true);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/website-check`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({url:url.trim()}),
      });
      const d=await res.json();
      if(!res.ok){setErr(d.error||"Prüfung konnte nicht durchgeführt werden.");setCheckBusy(false);return;}
      if(d.error){setErr(d.error);}
      await loadChecks();
      if(d.id)setExpandedId(d.id);
      setUrl("");
    }catch(e){
      setErr(describeError(e));
    }
    setCheckBusy(false);
  };

  const downloadPdf=async(check)=>{
    setPdfBusyId(check.id);
    try{
      await generateWebsiteCheckReport(check);
    }catch(e){
      setErr(describeError(e));
    }
    setPdfBusyId(null);
  };

  const deleteCheck=async(check)=>{
    setDeleteBusyId(check.id);
    try{
      const {error}=await supabase.from("website_checks").delete().eq("id",check.id);
      if(error){setErr(describeError(error));setDeleteBusyId(null);return;}
      await loadChecks();
    }catch(e){
      setErr(describeError(e));
    }
    setDeleteBusyId(null);
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>🌐 Website-Check</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Website prüfen</p>
        <p style={{fontSize:12,color:C.mu,marginBottom:10,lineHeight:1.5}}>Prüft eine beliebige URL serverseitig auf Technik, Sicherheit, SEO und Barrierefreiheit — Ergebnis erscheint direkt, kein externer Testlauf nötig.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")runCheck();}} placeholder="z. B. beispiel-kunde.de" style={{...input,flex:1,minWidth:220}}/>
          <button onClick={runCheck} disabled={checkBusy||!url.trim()} style={{...pri,flexShrink:0,opacity:(checkBusy||!url.trim())?.6:1}}>{checkBusy?"...":"▶ Prüfen"}</button>
        </div>
      </div>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Bisherige Prüfungen</p>
      {checks===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Wird geladen...</p>}
      {checks?.length===0&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Noch keine Prüfungen. Starte oben die erste.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {checks?.map(c=>{
          const open=expandedId===c.id;
          const summary=c.report?.summary;
          const displayUrl=c.report?.target?.final_url||c.url;
          const overallStatus=c.status==="error"?"error":(summary?.status||"error");
          return(
            <div key={c.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
              <button onClick={()=>setExpandedId(open?null:c.id)} style={{background:"none",border:"none",padding:0,cursor:"pointer",width:"100%",textAlign:"left",fontFamily:ff,color:"inherit"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,fontWeight:600,wordBreak:"break-all"}}>{displayUrl}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:600,background:C.s2,color:STATUS_COLOR[overallStatus]||C.mu,whiteSpace:"nowrap"}}>{STATUS_LABEL[overallStatus]||overallStatus}</span>
                </div>
                <p style={{fontSize:11,color:C.mu,margin:"4px 0 0"}}>Geprüft {fmtDateTime(c.created_at)}{summary?` · ${summary.ok??0} OK · ${summary.warn??0} Hinweis(e) · ${summary.error??0} Fehler`:""}</p>
              </button>
              {open&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.bd}`}}>
                {c.error_text&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:10}}>{c.error_text}</p>}
                {Array.isArray(c.report?.findings)&&c.report.findings.length>0&&<div style={{marginBottom:10}}>
                  <p style={{fontSize:11,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".04em",margin:"0 0 6px"}}>Gefundene Punkte</p>
                  {c.report.findings.map(f=>(
                    <p key={f.id} style={{fontSize:12,color:C.t2,margin:"0 0 4px"}}><span style={{color:STATUS_COLOR[f.status]||C.mu,fontWeight:600}}>{STATUS_LABEL[f.status]||f.status}</span> · {f.symptom} — {f.fix}</p>
                  ))}
                </div>}
                {Array.isArray(c.report?.findings)&&c.report.findings.length===0&&c.report?.checks?.length>0&&
                  <p style={{fontSize:12,color:C.gr,marginBottom:10}}>Keine Auffälligkeiten gefunden.</p>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {c.report&&<button onClick={()=>downloadPdf(c)} disabled={pdfBusyId===c.id} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:pdfBusyId===c.id?.6:1}}>
                    {pdfBusyId===c.id?"Wird erstellt...":"📄 Als PDF herunterladen"}
                  </button>}
                  <button onClick={()=>deleteCheck(c)} disabled={deleteBusyId===c.id} style={{...ghost,fontSize:12,padding:"7px 12px",color:C.co,opacity:deleteBusyId===c.id?.6:1}}>
                    {deleteBusyId===c.id?"...":"🗑 Löschen"}
                  </button>
                </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div></div>
  );
}
