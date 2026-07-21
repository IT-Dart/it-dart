import { useEffect, useState } from "react";
import { C, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

export default function TrainerScreen({onClose,onOpenUser}){
  const {user}=useAuth();
  const [trainees,setTrainees]=useState(null); // null = lädt
  const [err,setErr]=useState(null);

  useEffect(()=>{
    if(!user){setTrainees([]);return;}
    let cancelled=false;
    (async()=>{
      const {data:links,error:linkErr}=await supabase.from("trainer_trainees").select("trainee_id").eq("trainer_id",user.id);
      if(linkErr){if(!cancelled){setErr(describeError(linkErr));setTrainees([]);}return;}
      const traineeIds=(links||[]).map(l=>l.trainee_id);
      if(traineeIds.length===0){if(!cancelled)setTrainees([]);return;}

      const [{data:profiles,error:profErr},{data:nachweise,error:nachErr}]=await Promise.all([
        supabase.from("profiles").select("id,email").in("id",traineeIds),
        supabase.from("lernnachweise").select("user_id").in("user_id",traineeIds),
      ]);
      if(cancelled)return;
      if(profErr||nachErr){setErr(describeError(profErr||nachErr));setTrainees([]);return;}
      const counts={};
      (nachweise||[]).forEach(n=>{counts[n.user_id]=(counts[n.user_id]||0)+1;});
      setTrainees((profiles||[]).map(p=>({...p,count:counts[p.id]||0})));
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

      {trainees===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Wird geladen...</p>}
      {trainees?.length===0&&!err&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Dir sind noch keine Testenden zugewiesen. Das übernimmt die Administration.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {trainees?.map(trainee=>(
          <button key={trainee.id} onClick={()=>onOpenUser?.(trainee)} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",fontFamily:ff,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600,color:C.t,wordBreak:"break-all"}}>{trainee.email} <span style={{fontSize:11,color:C.mu,fontWeight:400}}>· {trainee.count} Lernnachweis{trainee.count===1?"":"e"}</span></span>
            <span style={{fontSize:12,color:C.cy,flexShrink:0,marginLeft:12}}>Statistik ansehen →</span>
          </button>
        ))}
      </div>
    </div></div>
  );
}
