import { useEffect, useState } from "react";
import { C, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

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

export default function TrainerScreen({onClose,onOpenUser}){
  const {user}=useAuth();
  const [groups,setGroups]=useState(null); // null = lädt; [{trainee, rows}]
  const [err,setErr]=useState(null);

  useEffect(()=>{
    if(!user){setGroups([]);return;}
    let cancelled=false;
    (async()=>{
      const {data:links,error:linkErr}=await supabase.from("trainer_trainees").select("trainee_id").eq("trainer_id",user.id);
      if(linkErr){if(!cancelled){setErr(describeError(linkErr));setGroups([]);}return;}
      const traineeIds=(links||[]).map(l=>l.trainee_id);
      if(traineeIds.length===0){if(!cancelled)setGroups([]);return;}

      const [{data:profiles,error:profErr},{data:nachweise,error:nachErr}]=await Promise.all([
        supabase.from("profiles").select("id,email").in("id",traineeIds),
        supabase.from("lernnachweise").select("*").in("user_id",traineeIds).order("created_at",{ascending:false}),
      ]);
      if(cancelled)return;
      if(profErr||nachErr){setErr(describeError(profErr||nachErr));setGroups([]);return;}

      const byTrainee=traineeIds.map(id=>({
        trainee:(profiles||[]).find(p=>p.id===id)||{id,email:"Unbekannt"},
        rows:(nachweise||[]).filter(r=>r.user_id===id),
      }));
      setGroups(byTrainee);
    })();
    return ()=>{cancelled=true;};
  },[user?.id]);

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>🎓 Trainer-Ansicht</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      {groups===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Wird geladen...</p>}
      {groups?.length===0&&!err&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Dir sind noch keine Testenden zugewiesen. Das übernimmt die Administration.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        {groups?.map(({trainee,rows})=>(
          <div key={trainee.id}>
            <button onClick={()=>onOpenUser?.(trainee)} style={{background:"none",border:"none",padding:0,cursor:"pointer",textAlign:"left",fontFamily:ff}}>
              <p style={{fontSize:13,fontWeight:600,color:C.cy,marginBottom:8,textDecoration:"underline"}}>{trainee.email} <span style={{fontSize:11,color:C.mu,fontWeight:400,textDecoration:"none"}}>· {rows.length} Lernnachweis{rows.length===1?"":"e"} · Statistik ansehen →</span></p>
            </button>
            {rows.length===0&&<p style={{fontSize:12,color:C.mu,marginBottom:8}}>Noch keine Lernnachweise erzeugt.</p>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {rows.map(r=>{
                const zone=ZONE_INFO[r.badge]||{label:r.badge||"—",color:C.mu};
                return(
                  <div key={r.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:600,display:"block"}}>{r.title}</span>
                        <span style={{fontSize:11,color:C.mu}}>{r.kind==="pruefung"?"Prüfungsvorbereitung":"Modul-Quiz"} · {fmtDateTime(r.created_at)}</span>
                      </div>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:600,background:C.s2,color:zone.color,whiteSpace:"nowrap"}}>{zone.label}</span>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:16}}>
                      <div><div style={{fontSize:10,color:C.mu,textTransform:"uppercase",letterSpacing:".04em"}}>Ergebnis</div><div style={{fontSize:13,fontWeight:600,color:C.t}}>{r.percent}% ({r.score}/{r.total})</div></div>
                      <div><div style={{fontSize:10,color:C.mu,textTransform:"uppercase",letterSpacing:".04em"}}>Dauer</div><div style={{fontSize:12,color:C.t2}}>{fmtDauer(r.started_at,r.finished_at)}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div></div>
  );
}
