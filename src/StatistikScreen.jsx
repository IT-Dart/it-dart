import { useEffect, useState } from "react";
import { C, ghost, pri, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";
import { generateLernnachweis } from "./lib/lernnachweis";
import { MODS } from "./lib/modules";

const ZONE_INFO = {
  bullseye: { label: "Bullseye", color: C.am },
  hervorragend: { label: "Hervorragend", color: C.am },
  gut: { label: "Gut", color: C.cy },
  besser: { label: "Ausbaufähig", color: C.bl },
  fehlwurf: { label: "Fehlwurf", color: C.co },
};

const fmtDateTime=(iso)=>iso?new Date(iso).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";

const fmtDauer=(startedIso,finishedIso)=>{
  if(!startedIso||!finishedIso)return "—";
  const sec=Math.max(0,Math.round((new Date(finishedIso)-new Date(startedIso))/1000));
  const m=Math.floor(sec/60),s=sec%60;
  return m>0?`${m} Min ${s} Sek`:`${s} Sek`;
};

export default function StatistikScreen({onClose,viewUser}){
  const {user:ownUser}=useAuth();
  const user=viewUser||ownUser; // Trainer sieht die Statistik eines Trainees statt seiner eigenen
  const [rows,setRows]=useState(null); // null = lädt
  const [err,setErr]=useState(null);
  const [busyId,setBusyId]=useState(null);
  const [dlErr,setDlErr]=useState(null);
  const [progress,setProgress]=useState(null); // null = lädt, sonst {modId: [Themennummern]}
  const [progressErr,setProgressErr]=useState(null);

  useEffect(()=>{
    if(!user){setRows([]);return;}
    let cancelled=false;
    supabase.from("lernnachweise").select("*").eq("user_id",user.id).order("created_at",{ascending:false})
      .then(({data,error})=>{
        if(cancelled)return;
        if(error){setErr(describeError(error));setRows([]);return;}
        setRows(data||[]);
      });
    return ()=>{cancelled=true;};
  },[user?.id]);

  useEffect(()=>{
    if(!user){setProgress({});return;}
    let cancelled=false;
    supabase.from("progress").select("data").eq("user_id",user.id).maybeSingle()
      .then(({data,error})=>{
        if(cancelled)return;
        if(error){setProgressErr(describeError(error));setProgress({});return;}
        setProgress(data?.data||{});
      });
    return ()=>{cancelled=true;};
  },[user?.id]);

  const nachladen=async(row)=>{
    setBusyId(row.id);
    setDlErr(null);
    try{
      await generateLernnachweis({
        user,
        kind:row.kind,
        title:row.title,
        score:row.score,
        total:row.total,
        topics:row.topics||[{name:row.title,correct:row.score,total:row.total}],
        startedAt:row.started_at,
        finishedAt:row.finished_at||row.created_at,
        skipLog:true,
      });
    }catch(e){
      setDlErr(describeError(e));
    }finally{
      setBusyId(null);
    }
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>📊 {viewUser?`Statistik von ${viewUser.email}`:"Meine Statistik"}</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}
      {progressErr&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{progressErr}</p>
      </div>}
      {dlErr&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>Lernnachweis konnte nicht erstellt werden: {dlErr}</p>
      </div>}

      <div style={{marginBottom:28}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Modulfortschritt</p>
        {progress===null?(
          <p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"12px 0"}}>Wird geladen...</p>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {MODS.filter(m=>m.r).map(m=>{
              const done=new Set(progress[m.id]||[]).size;
              const pct=Math.round((done/m.n)*100);
              return(
                <div key={m.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"10px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:600}} dangerouslySetInnerHTML={{__html:`${m.e} ${m.t}`}}/>
                    <span style={{fontSize:11,color:C.mu,flexShrink:0}}>{done} / {m.n}</span>
                  </div>
                  <div style={{height:4,background:C.s2,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.bl},${C.cy})`,borderRadius:2,transition:"width .4s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Lernnachweise</p>
      {rows===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Wird geladen...</p>}
      {rows?.length===0&&!err&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>{viewUser?"Noch keine Lernnachweise vorhanden.":"Noch keine Lernnachweise erzeugt. Sobald du ein Modul-Quiz oder eine Prüfungsvorbereitung abschließt, taucht sie hier auf."}</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {rows?.map(r=>{
          const zone=ZONE_INFO[r.badge]||{label:r.badge||"—",color:C.mu};
          return(
            <div key={r.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
                <div>
                  <span style={{fontSize:14,fontWeight:600,display:"block"}}>{r.title}</span>
                  <span style={{fontSize:11,color:C.mu}}>{r.kind==="pruefung"?"Prüfungsvorbereitung":"Modul-Quiz"} · {fmtDateTime(r.created_at)}</span>
                </div>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:600,background:C.s2,color:zone.color,whiteSpace:"nowrap"}}>{zone.label}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:10}}>
                <div><div style={{fontSize:10,color:C.mu,textTransform:"uppercase",letterSpacing:".04em"}}>Ergebnis</div><div style={{fontSize:14,fontWeight:600,color:C.t}}>{r.percent}% ({r.score}/{r.total})</div></div>
                <div><div style={{fontSize:10,color:C.mu,textTransform:"uppercase",letterSpacing:".04em"}}>Begonnen</div><div style={{fontSize:13,color:C.t2}}>{fmtDateTime(r.started_at)}</div></div>
                <div><div style={{fontSize:10,color:C.mu,textTransform:"uppercase",letterSpacing:".04em"}}>Abgeschlossen</div><div style={{fontSize:13,color:C.t2}}>{fmtDateTime(r.finished_at)}</div></div>
                <div><div style={{fontSize:10,color:C.mu,textTransform:"uppercase",letterSpacing:".04em"}}>Dauer</div><div style={{fontSize:13,color:C.t2}}>{fmtDauer(r.started_at,r.finished_at)}</div></div>
              </div>
              <button onClick={()=>nachladen(r)} disabled={busyId===r.id} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:busyId===r.id?.6:1}}>
                {busyId===r.id?"Wird erstellt...":"📄 Lernnachweis erneut herunterladen"}
              </button>
            </div>
          );
        })}
      </div>
    </div></div>
  );
}
