import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const fmtDate=(iso)=>iso?new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";

// Junior-Admin: Lesezugriff auf die Nutzerliste, Einladungen versenden/
// verwalten und Trainer-Zuordnungen unterstützen — bewusst ohne Löschung,
// Rollen-/Premium-Vergabe oder Zugriff auf Secrets. Die eigentliche
// Sicherheitsgrenze liegt serverseitig (RLS + Edge Functions); diese
// Ansicht enthält schlicht keinen Code-Pfad für die verbotenen Aktionen.
export default function JuniorAdminScreen({onClose}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [actionBusy,setActionBusy]=useState(null);
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteBusy,setInviteBusy]=useState(false);
  const [inviteMsg,setInviteMsg]=useState(null);
  const [assignPanels,setAssignPanels]=useState({});
  const [trainerList,setTrainerList]=useState(null);
  const [traineePanels,setTraineePanels]=useState({});
  const [allUsers,setAllUsers]=useState(null);

  const loadAllUsers=async()=>{
    const {data,error}=await supabase.from("profiles").select("id,email").order("email");
    if(error){setAllUsers([]);return;}
    setAllUsers(data||[]);
  };
  useEffect(()=>{loadAllUsers();},[]);

  const loadTrainerList=async()=>{
    const {data:trainers,error:tErr}=await supabase.from("profiles").select("id,email,trainee_limit").eq("is_trainer",true).order("email");
    if(tErr){setTrainerList([]);return;}
    const ids=(trainers||[]).map(t=>t.id);
    const counts={};
    if(ids.length){
      const {data:links}=await supabase.from("trainer_trainees").select("trainer_id").in("trainer_id",ids);
      (links||[]).forEach(l=>{counts[l.trainer_id]=(counts[l.trainer_id]||0)+1;});
    }
    setTrainerList((trainers||[]).map(t=>({...t,count:counts[t.id]||0})));
  };
  useEffect(()=>{loadTrainerList();},[]);

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
      setInviteMsg({type:"info",text:`Einladung an ${inviteEmail.trim()} verschickt.`});
      setInviteEmail("");
      if(results)search();
    }catch(e){
      setInviteMsg({type:"error",text:describeError(e)});
    }
    setInviteBusy(false);
  };

  const search=async(e)=>{
    e?.preventDefault();
    setBusy(true);setErr(null);
    const {data,error}=await supabase
      .from("profiles")
      .select("id,email,is_premium,premium_until,is_trainer,ai_enabled,confirmed_at,created_at,trainee_limit")
      .ilike("email",`%${query.trim()}%`)
      .order("created_at",{ascending:false})
      .limit(25);
    setBusy(false);
    if(error){setErr(describeError(error));return;}
    setResults(data||[]);
  };

  const managePending=async(id,action)=>{
    if(action==="delete"&&!window.confirm("Diese ausstehende Einladung wirklich löschen? Der noch nicht aktivierte Account wird dabei komplett entfernt."))return;
    setActionBusy(id);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trainer-manage-invite`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({action,userId:id}),
      });
      const d=await res.json();
      if(!res.ok){setErr(d.error||"Aktion fehlgeschlagen.");setActionBusy(null);return;}
    }catch(e){
      setErr(describeError(e));setActionBusy(null);return;
    }
    setActionBusy(null);
    search();
  };

  const updateQuota=async(traineeId,newLimit)=>{
    setActionBusy(traineeId);
    const {error}=await supabase.rpc("update_trainee_limit",{target_id:traineeId,new_limit:newLimit});
    setActionBusy(null);
    if(error){setErr(describeError(error));return;}
    setResults(rs=>rs.map(r=>r.id===traineeId?{...r,trainee_limit:newLimit}:r));
    loadTrainerList();
  };

  const toggleAi=async(r)=>{
    setActionBusy(r.id);
    const nextEnabled=!(r.ai_enabled??true);
    const {error}=await supabase.rpc("set_ai_enabled",{target_id:r.id,enabled:nextEnabled});
    setActionBusy(null);
    if(error){setErr(describeError(error));return;}
    setResults(rs=>rs.map(x=>x.id===r.id?{...x,ai_enabled:nextEnabled}:x));
  };

  const panelFor=(id)=>traineePanels[id]||{open:false,loading:false,trainees:null,input:"",err:null};
  const setPanel=(id,patch)=>setTraineePanels(p=>({...p,[id]:{...(p[id]||{open:false,loading:false,trainees:null,input:"",err:null}),...patch}}));

  const loadTrainees=async(trainerId)=>{
    setPanel(trainerId,{open:true,loading:true,err:null});
    const {data,error}=await supabase.from("trainer_trainees").select("trainee_id, profiles!trainee_id(id,email)").eq("trainer_id",trainerId);
    if(error){setPanel(trainerId,{loading:false,err:describeError(error)});return;}
    setPanel(trainerId,{loading:false,trainees:(data||[]).map(d=>d.profiles).filter(Boolean)});
  };

  const toggleTraineePanel=(trainerId)=>{
    const p=panelFor(trainerId);
    if(p.open){setPanel(trainerId,{open:false});return;}
    loadTrainees(trainerId);
  };

  const addTrainee=async(trainerId,limit)=>{
    const panel=panelFor(trainerId);
    const traineeId=panel.input;
    if(!traineeId)return;
    if((panel.trainees?.length??0)>=limit){
      setPanel(trainerId,{err:`Maximale Anzahl an Trainees erreicht (${panel.trainees.length}/${limit}).`});
      return;
    }
    setPanel(trainerId,{loading:true,err:null});
    const {error:insErr}=await supabase.from("trainer_trainees").insert({trainer_id:trainerId,trainee_id:traineeId});
    if(insErr){setPanel(trainerId,{loading:false,err:insErr.code==="23505"?"Dieser Nutzer ist diesem Trainer bereits zugewiesen.":describeError(insErr)});return;}
    setPanel(trainerId,{input:""});
    loadTrainees(trainerId);
    loadTrainerList();
  };

  const removeTrainee=async(trainerId,traineeId)=>{
    setPanel(trainerId,{loading:true});
    const {error}=await supabase.from("trainer_trainees").delete().eq("trainer_id",trainerId).eq("trainee_id",traineeId);
    if(error){setPanel(trainerId,{loading:false,err:describeError(error)});return;}
    loadTrainees(trainerId);
    loadTrainerList();
  };

  const assignPanelFor=(id)=>assignPanels[id]||{open:false,loading:false,trainers:null,select:"",err:null};
  const setAssignPanel=(id,patch)=>setAssignPanels(p=>({...p,[id]:{...(p[id]||{open:false,loading:false,trainers:null,select:"",err:null}),...patch}}));

  const loadAssignedTrainers=async(traineeId)=>{
    setAssignPanel(traineeId,{open:true,loading:true,err:null});
    const {data,error}=await supabase.from("trainer_trainees").select("trainer_id, profiles!trainer_id(id,email)").eq("trainee_id",traineeId);
    if(error){setAssignPanel(traineeId,{loading:false,err:describeError(error)});return;}
    setAssignPanel(traineeId,{loading:false,trainers:(data||[]).map(d=>d.profiles).filter(Boolean)});
  };

  const toggleAssignPanel=(traineeId)=>{
    const p=assignPanelFor(traineeId);
    if(p.open){setAssignPanel(traineeId,{open:false});return;}
    loadAssignedTrainers(traineeId);
  };

  const assignToTrainer=async(traineeId)=>{
    const trainerId=assignPanelFor(traineeId).select;
    if(!trainerId)return;
    const trainer=trainerList?.find(t=>t.id===trainerId);
    if(trainer&&trainer.count>=trainer.trainee_limit){
      setAssignPanel(traineeId,{err:`Maximale Anzahl an Trainees erreicht (${trainer.count}/${trainer.trainee_limit}).`});
      return;
    }
    setAssignPanel(traineeId,{loading:true,err:null});
    const {error}=await supabase.from("trainer_trainees").insert({trainer_id:trainerId,trainee_id:traineeId});
    if(error){setAssignPanel(traineeId,{loading:false,err:error.code==="23505"?"Dieser Nutzer ist diesem Trainer bereits zugewiesen.":describeError(error)});return;}
    setAssignPanel(traineeId,{select:""});
    loadAssignedTrainers(traineeId);
    loadTrainerList();
  };

  const unassignTrainer=async(traineeId,trainerId)=>{
    setAssignPanel(traineeId,{loading:true});
    const {error}=await supabase.from("trainer_trainees").delete().eq("trainer_id",trainerId).eq("trainee_id",traineeId);
    if(error){setAssignPanel(traineeId,{loading:false,err:describeError(error)});return;}
    loadAssignedTrainers(traineeId);
    loadTrainerList();
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>🧑‍💼 Junior-Admin</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      <div style={{background:"#12203f",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"10px 14px",marginBottom:20}}>
        <p style={{fontSize:12,color:"#93c5fd",margin:0,lineHeight:1.6}}>Eingeschränkter Zugang: Nutzer einsehen, einladen, KI-Zugriff und Trainer-Zuordnungen/Kontingente verwalten. Kein Löschen aktiver Konten, keine Vergabe von Admin-/Trainer-/Premium-Rechten.</p>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Neuen Nutzer einladen</p>
        <form onSubmit={invite} style={{display:"flex",gap:8}}>
          <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} type="email" placeholder="email@beispiel.de" style={input}/>
          <button type="submit" disabled={inviteBusy} style={{...pri,flexShrink:0,opacity:inviteBusy?.6:1}}>{inviteBusy?"...":"Einladen"}</button>
        </form>
        {inviteMsg&&<p style={{fontSize:12,color:inviteMsg.type==="error"?"#fca5a5":"#86efac",marginTop:8,marginBottom:0}}>{inviteMsg.text}</p>}
      </div>

      <form onSubmit={search} style={{display:"flex",gap:8,marginBottom:20}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="E-Mail suchen..." style={input} autoFocus/>
        <button type="submit" disabled={busy} style={{...pri,flexShrink:0,opacity:busy?.6:1}}>{busy?"...":"Suchen"}</button>
      </form>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      {results===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>E-Mail (oder Teil davon) eingeben und suchen.</p>}
      {results?.length===0&&!err&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Keine Treffer.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {results?.map(r=>{
          const until=r.premium_until&&new Date(r.premium_until)>new Date()?new Date(r.premium_until).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
          const active=r.is_premium||until;
          const aiOn=r.ai_enabled??true;
          const assignPanel=assignPanelFor(r.id);
          const panel=panelFor(r.id);
          const atCapacity=panel.trainees!=null&&panel.trainees.length>=r.trainee_limit;
          return(
            <div key={r.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
              <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
                <span style={{fontSize:14,fontWeight:600,overflowWrap:"anywhere"}}>{r.email}</span>
                <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:active?"#14532d":"#2a1a0f",color:active?"#86efac":"#fbbf24"}}>
                    {r.is_premium?"⭐ Dauerhaft":until?`Bis ${until}`:"Free"}
                  </span>
                  {!aiOn&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#450a0a",color:"#fca5a5"}}>🤖 Gesperrt</span>}
                  {r.is_trainer&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#1e3a5f",color:"#93c5fd"}}>🎓 Trainer</span>}
                  {!r.confirmed_at&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#3a2a0f",color:"#fbbf24"}}>⏳ Einladung ausstehend</span>}
                </div>
              </div>
              <p style={{fontSize:11,color:C.mu,margin:"0 0 10px"}}>Registriert am {fmtDate(r.created_at)}</p>

              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {!r.confirmed_at&&<>
                  <button disabled={actionBusy===r.id} onClick={()=>managePending(r.id,"resend")} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:actionBusy===r.id?.6:1}}>🔁 Erneut senden</button>
                  <button disabled={actionBusy===r.id} onClick={()=>managePending(r.id,"delete")} style={{...ghost,fontSize:12,padding:"7px 12px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:actionBusy===r.id?.6:1}}>🗑 Einladung löschen</button>
                </>}
                <button disabled={actionBusy===r.id} onClick={()=>toggleAi(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:actionBusy===r.id?.6:1}}>
                  {aiOn?"🤖 KI sperren":"🤖 KI freischalten"}
                </button>
                <button onClick={()=>toggleAssignPanel(r.id)} style={{...ghost,fontSize:12,padding:"7px 12px"}}>
                  {assignPanel.open?"Trainer-Zuweisung verbergen ▴":"Trainer zuweisen ▾"}
                </button>
                {r.is_trainer&&<button onClick={()=>toggleTraineePanel(r.id)} style={{...ghost,fontSize:12,padding:"7px 12px"}}>
                  {panel.open?"Trainees verbergen ▴":"Trainees verwalten ▾"}
                </button>}
              </div>

              {r.is_trainer&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,fontSize:11,color:C.mu}}>
                Kontingent:
                <input type="number" min="0" defaultValue={r.trainee_limit} onBlur={e=>{const v=Math.max(0,parseInt(e.target.value,10)||0);if(v!==r.trainee_limit)updateQuota(r.id,v);}} style={{width:52,background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:6,color:C.t,padding:"3px 6px",fontSize:11,fontFamily:"inherit"}}/>
              </div>}

              {panel.open&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.bd}`}}>
                  <p style={{fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:8}}>Testende · {panel.trainees?.length??0} / {r.trainee_limit}</p>
                  {panel.loading&&<p style={{fontSize:12,color:C.mu}}>Wird geladen...</p>}
                  {panel.err&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:8}}>{panel.err}</p>}
                  {!panel.loading&&panel.trainees?.length===0&&<p style={{fontSize:12,color:C.mu,marginBottom:8}}>Noch keine Testenden zugewiesen.</p>}
                  {!panel.loading&&panel.trainees?.map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                      <span style={{fontSize:13,color:C.t2,wordBreak:"break-all"}}>{t.email}</span>
                      <button onClick={()=>removeTrainee(r.id,t.id)} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:12,padding:0,fontFamily:ff}}>Entfernen</button>
                    </div>
                  ))}
                  {atCapacity&&<p style={{fontSize:12,color:"#fbbf24",marginTop:8}}>Kontingent voll ({panel.trainees.length}/{r.trainee_limit}). Erhöhe die Zahl oben, um weitere Testende zuzuweisen.</p>}
                  {!atCapacity&&!allUsers?.filter(u=>u.id!==r.id&&!panel.trainees?.some(t=>t.id===u.id)).length&&<p style={{fontSize:12,color:C.mu,marginTop:8}}>{allUsers===null?"Nutzerliste wird geladen...":"Kein weiterer Nutzer zum Zuweisen verfügbar."}</p>}
                  {!atCapacity&&!!allUsers?.filter(u=>u.id!==r.id&&!panel.trainees?.some(t=>t.id===u.id)).length&&(
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <select value={panel.input} onChange={e=>setPanel(r.id,{input:e.target.value})} style={{...input,fontSize:13,padding:"8px 12px"}}>
                        <option value="">Nutzer wählen...</option>
                        {allUsers.filter(u=>u.id!==r.id&&!panel.trainees?.some(t=>t.id===u.id)).map(u=>(
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                      </select>
                      <button disabled={atCapacity} onClick={()=>addTrainee(r.id,r.trainee_limit)} style={{...ghost,flexShrink:0,fontSize:12,padding:"7px 12px",opacity:atCapacity?.6:1}}>+ Hinzufügen</button>
                    </div>
                  )}
                </div>
              )}

              {assignPanel.open&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.bd}`}}>
                  <p style={{fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:8}}>Zugewiesener Trainer</p>
                  {assignPanel.loading&&<p style={{fontSize:12,color:C.mu}}>Wird geladen...</p>}
                  {assignPanel.err&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:8}}>{assignPanel.err}</p>}
                  {!assignPanel.loading&&assignPanel.trainers?.length===0&&<p style={{fontSize:12,color:C.mu,marginBottom:8}}>Noch keinem Trainer zugewiesen.</p>}
                  {!assignPanel.loading&&assignPanel.trainers?.map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                      <span style={{fontSize:13,color:C.t2,wordBreak:"break-all"}}>{t.email}</span>
                      <button onClick={()=>unassignTrainer(r.id,t.id)} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:12,padding:0,fontFamily:ff}}>Entfernen</button>
                    </div>
                  ))}
                  {!trainerList?.length&&<p style={{fontSize:12,color:C.mu,marginTop:8}}>Es gibt noch keine Trainer-Accounts.</p>}
                  {!!trainerList?.length&&(
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <select value={assignPanel.select} onChange={e=>setAssignPanel(r.id,{select:e.target.value})} style={{...input,fontSize:13,padding:"8px 12px"}}>
                        <option value="">Trainer wählen...</option>
                        {trainerList.filter(t=>t.id!==r.id).map(t=>{
                          const full=t.count>=t.trainee_limit;
                          return <option key={t.id} value={t.id} disabled={full}>{t.email} ({t.count}/{t.trainee_limit}{full?" — voll":""})</option>;
                        })}
                      </select>
                      <button onClick={()=>assignToTrainer(r.id)} style={{...ghost,flexShrink:0,fontSize:12,padding:"7px 12px"}}>Zuweisen</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div></div>
  );
}
