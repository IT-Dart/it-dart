import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { authFetch } from "./lib/authFetch";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const STATUS_LABEL={open:"Offen",in_progress:"In Arbeit",done:"Erledigt"};
const PRIORITY_LABEL={low:"Niedrig",medium:"Mittel",high:"Hoch"};
const PRIORITY_COLOR={low:C.mu,medium:C.am,high:C.co};

const fmtDate=(iso)=>iso?new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;

export default function TodoScreen({onClose}){
  const [todos,setTodos]=useState(null); // null=lädt noch
  const [tools,setTools]=useState([]);
  const [filter,setFilter]=useState("open"); // "open" | "in_progress" | "done" | "all"
  const [busyId,setBusyId]=useState(null);
  const [err,setErr]=useState(null);
  const [form,setForm]=useState({title:"",description:"",priority:"medium",tool_slug:""});
  const [addBusy,setAddBusy]=useState(false);
  const [solutions,setSolutions]=useState({}); // todoId -> {loading, answer, sources, error}
  const [editingId,setEditingId]=useState(null);
  const [editForm,setEditForm]=useState({title:"",description:"",priority:"medium",tool_slug:""});

  const load=async()=>{
    const {data,error}=await supabase.from("todos").select("*").order("status").order("priority",{ascending:false}).order("created_at",{ascending:false});
    if(error){setErr(describeError(error));setTodos([]);return;}
    setTodos(data||[]);
  };
  const loadTools=async()=>{
    const {data}=await supabase.from("tools").select("slug,name").order("name");
    setTools(data||[]);
  };
  useEffect(()=>{load();loadTools();},[]);

  const addTodo=async(e)=>{
    e.preventDefault();
    if(!form.title.trim())return;
    setAddBusy(true);setErr(null);
    const {error}=await supabase.from("todos").insert({
      title:form.title.trim(),
      description:form.description.trim()||null,
      priority:form.priority,
      tool_slug:form.tool_slug||null,
    });
    setAddBusy(false);
    if(error){setErr(describeError(error));return;}
    setForm({title:"",description:"",priority:"medium",tool_slug:""});
    load();
  };

  const setStatus=async(id,status)=>{
    setBusyId(id);
    const {error}=await supabase.from("todos").update({status}).eq("id",id);
    setBusyId(null);
    if(error){setErr(describeError(error));return;}
    load();
  };

  const findSolution=async(t)=>{
    if(solutions[t.id]?.loading)return;
    setSolutions(s=>({...s,[t.id]:{loading:true}}));
    try{
      const r=await authFetch("todo-solve",{todoId:t.id});
      const d=await r.json();
      if(!r.ok){setSolutions(s=>({...s,[t.id]:{error:d.error||"Fehlgeschlagen."}}));return;}
      setSolutions(s=>({...s,[t.id]:{answer:d.answer,sources:d.sources||[]}}));
    }catch(e){
      setSolutions(s=>({...s,[t.id]:{error:describeError(e)}}));
    }
  };

  const startEdit=(t)=>{
    setEditingId(t.id);
    setEditForm({title:t.title,description:t.description||"",priority:t.priority,tool_slug:t.tool_slug||""});
  };
  const cancelEdit=()=>setEditingId(null);
  const saveEdit=async(id)=>{
    if(!editForm.title.trim())return;
    setBusyId(id);
    const {error}=await supabase.from("todos").update({
      title:editForm.title.trim(),
      description:editForm.description.trim()||null,
      priority:editForm.priority,
      tool_slug:editForm.tool_slug||null,
    }).eq("id",id);
    setBusyId(null);
    if(error){setErr(describeError(error));return;}
    setEditingId(null);
    load();
  };

  const remove=async(id)=>{
    setBusyId(id);
    const {error}=await supabase.from("todos").delete().eq("id",id);
    setBusyId(null);
    if(error){setErr(describeError(error));return;}
    load();
  };

  const visible=(todos||[]).filter(t=>filter==="all"||t.status===filter);
  const counts={open:0,in_progress:0,done:0};
  (todos||[]).forEach(t=>{counts[t.status]=(counts[t.status]||0)+1;});

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>✅ To-Do</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Neuer Eintrag</p>
        <form onSubmit={addTodo} style={{display:"flex",flexDirection:"column",gap:8}}>
          <input placeholder="Titel" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={input} required/>
          <textarea placeholder="Beschreibung (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} style={{...input,resize:"vertical",fontFamily:"inherit"}}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...input,flex:"1 1 110px"}}>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
            <select value={form.tool_slug} onChange={e=>setForm(f=>({...f,tool_slug:e.target.value}))} style={{...input,flex:"1 1 140px"}}>
              <option value="">Kein Tool-Bezug</option>
              {tools.map(t=><option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={addBusy} style={{...pri,alignSelf:"flex-start",opacity:addBusy?.6:1}}>{addBusy?"...":"Hinzufügen"}</button>
        </form>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["open",`Offen (${counts.open||0})`],["in_progress",`In Arbeit (${counts.in_progress||0})`],["done",`Erledigt (${counts.done||0})`],["all","Alle"]].map(([k,label])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{...ghost,fontSize:12,padding:"6px 12px",background:filter===k?C.s2:"transparent",color:filter===k?C.t:C.t2,borderColor:filter===k?C.cy:C.bd}}>{label}</button>
        ))}
      </div>

      {todos===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Lädt…</p>}
      {todos!==null&&visible.length===0&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Keine Einträge.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map(t=>{
          const busy=busyId===t.id;
          const tool=tools.find(x=>x.slug===t.tool_slug);
          const created=fmtDate(t.created_at);
          const sol=solutions[t.id];
          const editing=editingId===t.id;
          if(editing)return(
            <div key={t.id} style={{background:C.s1,border:`0.5px solid ${C.cy}`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <input placeholder="Titel" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} style={input}/>
                <textarea placeholder="Beschreibung (optional)" value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} rows={2} style={{...input,resize:"vertical",fontFamily:"inherit"}}/>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <select value={editForm.priority} onChange={e=>setEditForm(f=>({...f,priority:e.target.value}))} style={{...input,flex:"1 1 110px"}}>
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                  <select value={editForm.tool_slug} onChange={e=>setEditForm(f=>({...f,tool_slug:e.target.value}))} style={{...input,flex:"1 1 140px"}}>
                    <option value="">Kein Tool-Bezug</option>
                    {tools.map(x=><option key={x.slug} value={x.slug}>{x.name}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button disabled={busy} onClick={()=>saveEdit(t.id)} style={{...pri,opacity:busy?.6:1}}>{busy?"...":"Speichern"}</button>
                  <button disabled={busy} onClick={cancelEdit} style={{...ghost,fontSize:13}}>Abbrechen</button>
                </div>
              </div>
            </div>
          );
          return(
            <div key={t.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",opacity:t.status==="done"?.6:1}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:t.description?4:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:600,textDecoration:t.status==="done"?"line-through":"none"}}>{t.title}</span>
                <span style={{fontSize:10,fontWeight:600,color:PRIORITY_COLOR[t.priority],textTransform:"uppercase",letterSpacing:".03em"}}>{PRIORITY_LABEL[t.priority]}</span>
                {tool&&<span style={{fontSize:11,color:C.mu}}>· {tool.name}</span>}
                {created&&<span style={{fontSize:11,color:C.mu}}>· erstellt {created}</span>}
              </div>
              {t.description&&<p style={{fontSize:12,color:C.t2,margin:"0 0 8px",lineHeight:1.5}}>{t.description}</p>}
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <select disabled={busy} value={t.status} onChange={e=>setStatus(t.id,e.target.value)} style={{...input,width:"auto",padding:"5px 10px",fontSize:12}}>
                  <option value="open">{STATUS_LABEL.open}</option>
                  <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                  <option value="done">{STATUS_LABEL.done}</option>
                </select>
                <button disabled={busy} onClick={()=>startEdit(t)} style={{...ghost,fontSize:12,padding:"6px 12px"}}>✎ Bearbeiten</button>
                <button disabled={busy||sol?.loading} title="Fragt Claude (mit Websuche bei Bedarf) nach einem Lösungsansatz" onClick={()=>findSolution(t)} style={{...ghost,fontSize:12,padding:"6px 12px",marginLeft:"auto",opacity:busy||sol?.loading?.5:1}}>{sol?.loading?"Sucht…":"🔍 Lösung suchen"}</button>
                <button disabled={busy} onClick={()=>remove(t.id)} style={{...ghost,fontSize:12,padding:"6px 12px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:busy?.5:1}}>Löschen</button>
              </div>
              {sol&&!sol.loading&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:`0.5px solid ${C.bd}`}}>
                  {sol.error?(
                    <p style={{fontSize:12,color:"#fca5a5",margin:0}}>{sol.error}</p>
                  ):(<>
                    <p style={{fontSize:12,color:C.t2,margin:"0 0 6px",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sol.answer}</p>
                    {sol.sources?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {sol.sources.map((src,i)=>(
                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.cy}}>{src.title||src.url}</a>
                      ))}
                    </div>}
                  </>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div></div>
  );
}
