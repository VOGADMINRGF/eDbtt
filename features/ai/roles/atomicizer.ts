import { runOpenAI } from "../providers/openai";
import { ATOMICIZER_V1 } from "../prompts/atomicizer";
import type { AtomicClaim } from "./shared_types";

function normalize(s:string){ return s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
function hashId(s:string){ const t=normalize(s).slice(0,512); let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0; return "clm-"+h.toString(16); }

export async function atomicize(text:string, maxClaims=8, timeoutMs=15000){
  const prompt = ATOMICIZER_V1.replace("<<<TEXT>>>", text.slice(0,8000));
  const r = await runOpenAI(prompt, { json:true, timeoutMs });
  if (!r.ok) return { claims:[], ms:r.ms, fallbackUsed:true };

  let json:any=null; try{ json=JSON.parse(r.text||"{}"); }catch{ return { claims:[], ms:r.ms, fallbackUsed:true }; }
  const arr = Array.isArray(json?.claims)? json.claims : [];
  const claims: AtomicClaim[] = arr.slice(0,maxClaims).map((c:any)=>({
    id: hashId(String(c?.text||"").trim()),
    text: String(c?.text||"").trim(),
    sachverhalt: c?.sachverhalt??null, zeitraum:c?.zeitraum??null, ort:c?.ort??null,
    ebene:c?.ebene??null, betroffene: Array.isArray(c?.betroffene)? c.betroffene.filter((x:any)=>x&&String(x).trim()).slice(0,6):[],
    messgroesse:c?.messgroesse??null, unsicherheiten: Array.isArray(c?.unsicherheiten)? c.unsicherheiten.slice(0,6):[]
  })).filter(c=>c.text);
  return { claims, raw:r.raw, ms:r.ms, fallbackUsed:false };
}
