import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const fmtDate=(iso)=>iso?new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):"unbekannt";
const fmtUntil=(iso)=>{
  if(!iso)return null;
  const d=new Date(iso);
  return d>new Date()?d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
};

const fmtRelative=(iso)=>{
  if(!iso)return "nie";
  const diffMin=Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if(diffMin<1)return "gerade eben";
  if(diffMin<60)return `vor ${diffMin} Min`;
  const h=Math.floor(diffMin/60);
  if(h<24)return `vor ${h} Std`;
  const d=Math.floor(h/24);
  if(d<30)return `vor ${d} Tag${d===1?"":"en"}`;
  const mo=Math.floor(d/30);
  return `vor ${mo} Monat${mo===1?"":"en"}`;
};

export default function TrainerScreen({onClose,onOpenUser}){
  const {user}=useAuth();
  const [trainees,setTrainees]=useState(null); // null = lädt
  const [limit,setLimit]=useState(null);
  const [err,setErr]=useState(null);
  const [actionBusy,setActionBusy]=useState(null); // traineeId gerade in Bearbeitung
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteBusy,setInviteBusy]=useState(false);
  const [inviteMsg,setInviteMsg]=useState(null);

  const load=async()=>{
    if(!user){setTrainees([]);return;}
    const [{data:links,error:linkErr},{data:own}]=await Promise.all([
      supabase.from("trainer_trainees").select("trainee_id").eq("trainer_id",user.id),
      supabase.from("profiles").select("trainee_limit").eq("id",user.id).single(),
    ]);
    setLimit(own?.trainee_limit??5);
    if(linkErr){setErr(describeError(linkErr));setTrainees([]);return;}
    const traineeIds=(links||[]).map(l=>l.trainee_id);
    if(traineeIds.length===0){setTrainees([]);return;}

    const [{data:profiles,error:profErr},{data:nachweise,error:nachErr}]=await Promise.all([
      supabase.from("profiles").select("id,email,confirmed_at,ai_enabled,interview_enabled,is_premium,premium_until,created_at").in("id",traineeIds),
      supabase.from("lernnachweise").select("user_id,percent,kind,title,created_at").in("user_id",traineeIds),
    ]);
    if(profErr||nachErr){setErr(describeError(profErr||nachErr));setTrainees([]);return;}

    const stats={};
    (nachweise||[]).forEach(n=>{
      const s=stats[n.user_id]||{count:0,sum:0,modules:new Set(),last:null};
      s.count++;s.sum+=n.percent||0;
      if(n.kind==="modul")s.modules.add(n.title);
      if(!s.last||new Date(n.created_at)>new Date(s.last))s.last=n.created_at;
      stats[n.user_id]=s;
    });
    setTrainees((profiles||[]).map(p=>{
      const s=stats[p.id];
      return {...p,attempts:s?.count||0,avgPct:s?Math.round(s.sum/s.count):null,moduleCount:s?s.modules.size:0,lastActive:s?.last||null};
    }));
  };

  useEffect(()=>{setErr(null);load();},[user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invite=async(e)=>{
    e.preventDefault();
    if(!inviteEmail.trim())return;
    setInviteBusy(true);setInviteMsg(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({email:inviteEmail.trim()}),
      });
      const d=await res.json();
      if(!res.ok){setInviteMsg({type:"error",text:d.error||"Einladen fehlgeschlagen."});setInviteBusy(false);return;}
      setInviteMsg({type:d.warning?"error":"info",text:d.warning||`Einladung an ${inviteEmail.trim()} verschickt und dir zugeordnet.`});
      setInviteEmail("");
      load();
    }catch(e){
      setInviteMsg({type:"error",text:describeError(e)});
    }
    setInviteBusy(false);
  };

  const managePending=async(traineeId,action)=>{
    if(action==="delete"&&!window.confirm("Diese Einladung wirklich löschen? Der noch nicht aktivierte Account wird dabei komplett entfernt."))return;
    setActionBusy(traineeId);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trainer-manage-invite`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({action,userId:traineeId}),
      });
      const d=await res.json();
      if(!res.ok){setErr(d.error||"Aktion fehlgeschlagen.");setActionBusy(null);return;}
    }catch(e){
      setErr(describeError(e));setActionBusy(null);return;
    }
    setActionBusy(null);
    load();
  };

  const removeActive=async(traineeId)=>{
    if(!window.confirm("Diesen Trainee nicht mehr betreuen? Der Account bleibt bestehen, nur die Zuordnung zu dir wird entfernt."))return;
    setActionBusy(traineeId);setErr(null);
    const {error}=await supabase.from("trainer_trainees").delete().eq("trainer_id",user.id).eq("trainee_id",traineeId);
    setActionBusy(null);
    if(error){setErr(describeError(error));return;}
    load();
  };

  // Trainer haben keine generelle Schreibberechtigung auf profiles — beide
  // Umschalter laufen über dieselben eng gefassten RPCs wie für Admin/
  // Junior-Admin, serverseitig zusätzlich auf die eigenen Trainees begrenzt.
  const toggleAi=async(t)=>{
    const next=!(t.ai_enabled??true);
    setActionBusy(t.id);
    const {error}=await supabase.rpc("set_ai_enabled",{target_id:t.id,enabled:next});
    setActionBusy(null);
    if(error){setErr(describeError(error));return;}
    setTrainees(ts=>ts.map(x=>x.id===t.id?{...x,ai_enabled:next}:x));
  };
  const toggleInterview=async(t)=>{
    const next=!(t.interview_enabled??true);
    setActionBusy(t.id);
    const {error}=await supabase.rpc("set_interview_enabled",{target_id:t.id,enabled:next});
    setActionBusy(null);
    if(error){setErr(describeError(error));return;}
    setTrainees(ts=>ts.map(x=>x.id===t.id?{...x,interview_enabled:next}:x));
  };

  const pending=trainees?.filter(t=>!t.confirmed_at)||[];
  const active=trainees?.filter(t=>t.confirmed_at)||[];
  const atCapacity=trainees!==null&&limit!==null&&trainees.length>=limit;

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>🎓 Trainer-Ansicht</span>
        {trainees!==null&&limit!==null&&<span style={{fontSize:12,color:C.mu}}>Testende: {trainees.length} / {limit}</span>}
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {user&&<div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Neuen Trainee einladen</p>
        {atCapacity?(
          <p style={{fontSize:12,color:"#fbbf24",margin:0}}>Kontingent voll ({trainees.length}/{limit}). Bitte wende dich an die Administration, um dein Kontingent zu erweitern.</p>
        ):(
          <form onSubmit={invite} style={{display:"flex",gap:8}}>
            <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} type="email" placeholder="schueler@beispiel.de" style={input}/>
            <button type="submit" disabled={inviteBusy} style={{...pri,flexShrink:0,opacity:inviteBusy?.6:1}}>{inviteBusy?"...":"Einladen"}</button>
          </form>
        )}
        {inviteMsg&&<p style={{fontSize:12,color:inviteMsg.type==="error"?"#fca5a5":"#86efac",marginTop:8,marginBottom:0}}>{inviteMsg.text}</p>}
      </div>}

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      {trainees===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Wird geladen...</p>}
      {trainees?.length===0&&!err&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Dir sind noch keine Testenden zugewiesen — lade oben jemanden ein, oder das übernimmt die Administration.</p>}

      {pending.length>0&&<>
        <p style={{fontSize:11,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".04em",margin:"0 0 8px"}}>⏳ Ausstehend ({pending.length})</p>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:active.length?20:0}}>
          {pending.map(t=>(
            <div key={t.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:600,color:C.t,wordBreak:"break-all"}}>{t.email}</span>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button disabled={actionBusy===t.id} onClick={()=>managePending(t.id,"resend")} style={{...ghost,fontSize:11,padding:"5px 10px",opacity:actionBusy===t.id?.6:1}}>🔁 Erneut senden</button>
                <button disabled={actionBusy===t.id} onClick={()=>managePending(t.id,"delete")} style={{...ghost,fontSize:11,padding:"5px 10px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:actionBusy===t.id?.6:1}}>🗑 Löschen</button>
              </div>
            </div>
          ))}
        </div>
      </>}

      {active.length>0&&<>
        <p style={{fontSize:11,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".04em",margin:"0 0 8px"}}>✅ Aktiv ({active.length})</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {active.map(t=>(
            <div key={t.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap",marginBottom:4}}>
                <button onClick={()=>onOpenUser?.(t)} style={{background:"none",border:"none",padding:0,cursor:"pointer",textAlign:"left",fontFamily:ff}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.cy,textDecoration:"underline",wordBreak:"break-all"}}>{t.email}</span>
                </button>
                <button disabled={actionBusy===t.id} onClick={()=>removeActive(t.id)} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:11,padding:0,fontFamily:ff,opacity:actionBusy===t.id?.6:1}}>Entfernen</button>
              </div>
              <p style={{fontSize:11,color:C.mu,margin:"0 0 4px"}}>{t.attempts>0?`${t.moduleCount} Modul${t.moduleCount===1?"":"e"} · Ø ${t.avgPct}% · zuletzt aktiv ${fmtRelative(t.lastActive)}`:"Noch keine Aktivität"}</p>
              <p style={{fontSize:11,color:C.mu,margin:"0 0 8px"}}>Registriert am {fmtDate(t.created_at)} · {t.is_premium?"⭐ Premium (dauerhaft)":fmtUntil(t.premium_until)?`⭐ Premium bis ${fmtUntil(t.premium_until)}`:"Free"}</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button disabled={actionBusy===t.id} onClick={()=>toggleAi(t)} style={{...ghost,fontSize:11,padding:"5px 10px",opacity:actionBusy===t.id?.6:1}}>
                  {(t.ai_enabled??true)?"🤖 KI sperren":"🤖 KI freischalten"}
                </button>
                <button disabled={actionBusy===t.id} onClick={()=>toggleInterview(t)} style={{...ghost,fontSize:11,padding:"5px 10px",opacity:actionBusy===t.id?.6:1}}>
                  {(t.interview_enabled??true)?"🎤 Mock-Interview sperren":"🎤 Mock-Interview freischalten"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </>}
    </div></div>
  );
}
