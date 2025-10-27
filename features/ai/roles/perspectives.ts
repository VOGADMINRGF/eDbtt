import { runOpenAI } from "../providers/openai";
import { PERSPECTIVES_V1 } from "../prompts/perspectives";
import type { AtomicClaim, Perspectives } from "./shared_types";

export async function makePerspectives(claims: AtomicClaim[], timeoutMs=9000){
  if (!claims.length) return { views:{} };
  const payload={ claims: claims.map(c=>({ text:c.text })) };
  const prompt = PERSPECTIVES_V1.replace("<<<CLAIMS>>>", JSON.stringify(payload,null,2));
  const r = await runOpenAI(prompt, { json:true, timeoutMs });
  if (!r.ok) return { views:{} };
  let json:any=null; try{ json=JSON.parse(r.text||"{}"); }catch{ return { views:{} }; }
  const out:Record<string,Perspectives> = {};
  const arr = Array.isArray(json?.views)? json.views : [];
  for (const row of arr) {
    const t=String(row?.claim||"").trim(); if (!t) continue;
    out[t]={ pro:Array.isArray(row?.pro)? row.pro.slice(0,3):[],
             contra:Array.isArray(row?.contra)? row.contra.slice(0,3):[],
             alternative:Array.isArray(row?.alternative)? row.alternative.slice(0,3):[] };
  }
  return { views: out };
}
