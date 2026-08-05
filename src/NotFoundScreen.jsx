import { C, pri, wrap, inner } from "./lib/theme";
import { Logo } from "./Logo";

export default function NotFoundScreen(){
  return (
    <div style={wrap}><div style={{...inner,textAlign:"center",paddingTop:60,paddingBottom:60}}>
      <Logo sz={64}/>
      <div style={{fontSize:15,fontWeight:700,color:C.cy,letterSpacing:2,marginTop:24,marginBottom:8}}>404</div>
      <h1 style={{fontSize:26,fontWeight:700,marginBottom:10}}>Daneben geworfen.</h1>
      <p style={{fontSize:14,color:C.t2,lineHeight:1.7,marginBottom:32}}>Diese Seite liegt außerhalb der Zielscheibe — es gibt sie nicht (mehr). Prüfe den Link oder kehre zurück zur Startseite.</p>
      <a href="/" className="btn-fx" style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15,textDecoration:"none",boxSizing:"border-box"}}>Zurück zur Startseite →</a>
    </div></div>
  );
}
