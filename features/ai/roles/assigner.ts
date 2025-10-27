import { runOpenAI } from "../providers/openai";
import { ASSIGNER_V1 } from "../prompts/assigner";
import type { AtomicClaim, JurisdictionLevel } from "./shared_types";

export async function assignZustaendigkeit(claims: AtomicClaim[], timeoutMs=12000){
  if (!claims.length) return { map:{} };
  const payload={ claims: claims.map(c=>({ text:c.text })) };
  const prompt = ASSIGNER_V1.replace("<<<CLAIMS>>>", JSON.stringify(payload,null,2));
  const r = await runOpenAI(prompt, { json:true, timeoutMs });
  if (!r.ok) return { map:{} };
  let json:any=null; try{ json=JSON.parse(r.text||"{}"); }catch{ return { map:{} }; }
  const out:Record<string,any> = {};
  for (const row of (Array.isArray(json?.map)? json.map:[])) {
    const t=String(row?.claim||"").trim(); if (!t) continue;
    out[t]={ ebene:(row?.zustandigkeit?.ebene as JurisdictionLevel)||"Bund",
             organ:String(row?.zustandigkeit?.organ||"").slice(0,120),
             begruendung:String(row?.zustandigkeit?.begruendung||"").slice(0,300) };
  }
  return { map: out };
}
