import { orchestrateClaim } from "@/features/ai/orchestrator_claims";
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as analyzeMulti } from "@/features/ai/orchestrator_contrib";
import { runOpenAI } from "@/features/ai/providers/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJson<T=any>(s:string){ try{ return JSON.parse(s) as T }catch{ return null } }
const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));

async function jsonFallback(text:string, maxClaims=3){
  const sys=`Extrahiere bis zu ${maxClaims} prägnante Claims in JSON.
Antwortformat STRICT:
{ "claims": [ { "text": string } ] }`;
  const r=await runOpenAI(
    `Text:\n"""${text.slice(0,6000)}"""\n\nGib NUR das JSON-Objekt zurück.`,
    { json:true, system:sys, timeoutMs:12000 }
  );
  if(!r.ok) return { claims:[], _meta:{ fallback:true, error:r.error??null, ms:r.ms } };
  const j=safeJson<{claims?:Array<{text:string}>}>(r.text?.trim()||"");
  const claims=(Array.isArray(j?.claims)?j!.claims:[]).filter(c=>c?.text && String(c.text).trim());
  return { claims, _meta:{ fallback:true, ms:r.ms, usage:r.usage } };
}

function stable(out:any, ms:number, note?:string){
  const base={ _meta:{ mode:"error", errors:note?[note]:[], tookMs:ms }, claims:[] as any[] };
  if(!out || typeof out!=="object") return base;
  if(!("_meta" in out)) return { ...base, result:out };
  if(!("claims" in out)) return { ...out, claims:[] };
  return out;
}

async function runOrchestrated(text:string, maxClaims:number){
  // Begrenze Orchestrierung hart – Race + Timeout
  const timeoutMs = 12000;
  const p = analyzeMulti(text, { maxClaims }).catch(()=>null) as Promise<any>;
  const o = await Promise.race([p, sleep(timeoutMs).then(()=>null)]);
  const bestText = String(o?.best?.text ?? text);
  let extracted = await analyzeContribution(bestText, { maxClaims }).catch(()=>({claims:[], _meta:{}}));

  if(!Array.isArray(extracted?.claims) || extracted.claims.length===0){
    const fb = await jsonFallback(bestText, maxClaims);
    extracted = { ...(extracted||{}), claims: fb.claims, _meta: { ...(extracted?._meta ?? {}), fallbackUsed:true } };
  }
  extracted._meta = {
    ...(extracted._meta ?? {}),
    mode: "multi+extract",
    provider: o?.best?.provider ?? null,
  };
  return extracted;
}

export async function POST(req:NextRequest){
  const t0 = Date.now();
  let ok=false, err: string|null = null, model: string|null=null, totalTokens: number|null=null;

  try{
    const u = new URL(req.url);
    const mode = u.searchParams.get("mode") || process.env.VOG_ANALYZE_MODE || "gpt";
      if (MODE === "orchestrated") {n
        const out = await orchestrateClaim(text);n
        return NextResponse.json({ ok:true, stage:"orchestrated", ...out }, { status:200, headers: { "cache-control":"no-store" } });n
      }n    const body = await req.json().catch(()=> ({}));
    const text = String(body?.text ?? "").trim().slice(0,8000);
    const maxClaims = Number(body?.maxClaims ?? 4);
    const _hints = body?.hints ?? null;

    if(!text){
      const ms=Date.now()-t0;
      return NextResponse.json(stable(null, ms, "no-text"), { status:200 });
    }

    let out:any;
    if(mode==="multi"){
      out = await runOrchestrated(text, maxClaims);
    }else{
      out = await analyzeContribution(text, { maxClaims }).catch(()=>({claims:[], _meta:{}}));
      if(!Array.isArray(out?.claims) || out.claims.length===0){
        const fb = await jsonFallback(text, maxClaims);
        out = { ...(out || {}), claims: fb.claims, _meta: { ...(out?._meta ?? {}), fallbackUsed:true } };
      }
      out._meta = { ...(out._meta ?? {}), mode:"gpt" };
    }

    // Meta auffüllen
    out._meta = { ...(out._meta ?? {}), tookMs: Date.now()-t0, hints:_hints ?? null };
    model = (out?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
    totalTokens = (out?._meta?.usage?.total_tokens ?? null) as any;
    ok=true;

    return NextResponse.json(stable(out, out._meta.tookMs), { status:200 });

  }catch(e:any){
    err=String(e?.message||e);
    const ms=Date.now()-t0;
    return NextResponse.json(stable(null, ms, err), { status:200 });

  }finally{
    try{
      const m = await import("@/lib/metrics/usage");
      const fn = (m as any)?.recordUsage;
      if(typeof fn==="function"){
        await fn({ ts:Date.now(), route:"/api/contributions/analyze", ok, err, ms:Date.now()-t0, model, totalTokens });
      }
    }catch{}
  }
}
