import { useEffect, useRef, useState } from "react";

// Sanftes Fade-in-on-Scroll, geteilt zwischen CompanyScreen.jsx und
// LegalPages.jsx. Zeigt Inhalte per IntersectionObserver einmalig an, sobald
// sie ins Blickfeld kommen -- respektiert prefers-reduced-motion, dann sofort
// voll sichtbar ohne Observer.
export function Reveal({children}){
  const ref=useRef(null);
  const [visible,setVisible]=useState(()=>window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(()=>{
    if(visible)return;
    const el=ref.current;
    if(!el)return;
    const io=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){setVisible(true);io.disconnect();}
    },{threshold:0.15,rootMargin:"0px 0px -40px 0px"});
    io.observe(el);
    return()=>io.disconnect();
  },[visible]);
  return <div ref={ref} style={{opacity:visible?1:0,transform:visible?"none":"translateY(16px)",transition:"opacity 0.6s ease,transform 0.6s ease"}}>{children}</div>;
}
