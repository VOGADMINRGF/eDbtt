#!/usr/bin/env bash
set -euo pipefail

WEB="apps/web/src"
FEAT="$WEB/features"; [ -d "$FEAT" ] || FEAT="features"  # falls features top-level

backup(){ [ -f "$1" ] && cp "$1" "$1.bak.$(date +%s)" || true; }
write(){ mkdir -p "$(dirname "$1")"; cat > "$1"; echo "✓ wrote $1"; }

echo "› Perf-Hotfix: Backups & Patch …"

###############################################################################
# 1) /api/quality/clarify — Hybrid (Heuristik + Mini-LLM) mit harter 1.6s-Deadline
###############################################################################
TARGET="$WEB/app/api/quality/clarify/route.ts"; backup "$TARGET"; write "$TARGET" <<'TS'
import { NextRequest, NextResponse } from "next/server";

// ——— Simple LRU mit TTL, um Tippen-Spitzen abzupuffern ————————————————
type CacheRec = { value:any; exp:number };
const LRU = new Map<string,CacheRec>();
const MAX=200, TTL=5*60*1000;
function getK(k:string){ const r = LRU.get(k); if(!r) return null; if(Date.now()>r.exp){ LRU.delete(k); return null; } return r.value; }
function setK(k:string,v:any){ if(LRU.size>MAX){ const first = LRU.keys().next().value; if(first) LRU.delete(first); } LRU.set(k,{value:v,exp:Date.now()+TTL}); }

// ——— Heuristiken: schneller, deterministischer „First Guess“ ————————————
function heuristic(text:string){
  const t = text.toLowerCase();
  const hints:any = { level:"unsicher", region:null, timeframe:"unsicher", audience:"unsicher", stance:"unsicher", other:{} };

  // Ebene/Zuständigkeit
  if(/\beu(ropa)?\b/.test(t) || /kommission|parlament\s+der\s+eu/i.test(text)) hints.level="eu";
  else if(/\bbund(es)?\b/.test(t) || /bundesregierung|bundestag/i.test(text)) hints.level="bund";
  else if(/\bland\b|\blandes\b|bayern|nrw|baden[-\s]?württemberg|sachsen|berlin/i.test(text)) hints.level="land";
  else if(/\bkommune\b|\bstadt\b|\bbezirk\b|\bgemeinde\b|\brathaus\b/i.test(text)) hints.level="kommune";

  // Region
  const mCity = text.match(/\b(Berlin|Hamburg|München|Köln|Frankfurt|Stuttgart|Dresden|Leipzig|Düsseldorf|Bremen|Essen)\b/i);
  if(mCity) hints.region = mCity[0];

  // Zeitraum
  if(/letzte(n|r)?\s+12\s*mon/i.test(t)) hints.timeframe="letzte_12m";
  else if(/letzte(n|r)?\s+5\s*jahr/i.test(t)) hints.timeframe="letzte_5y";
  else if(/seit\s*1990/i.test(t)) hints.timeframe="seit_1990";
  else if(/aktuell|derzeit|momentan/i.test(t)) hints.timeframe="aktuell";

  // Audience
  if(/jugend|schüler|student/i.test(t)) hints.audience="jugend";
  else if(/unternehmen|wirtschaft|betrieb/i.test(t)) hints.audience="unternehmen";
  else if(/amt|behörde|verwaltung|staat/i.test(t)) hints.audience="staat";
  else if(/rentner|senior/i.test(t)) hints.audience="senioren";

  // Haltung (naiv)
  if(/\bgegen\b|lehne|ablehne|keine?\s+steigerung|kritisch/i.test(t)) hints.stance="contra";
  else if(/\bfür\b|unterstütze|befürworte/i.test(t)) hints.stance="pro";
  else if(/\bneutral\b|abwägen|beide seiten/i.test(t)) hints.stance="neutral";

  return hints;
}

// ——— Mini-LLM (OpenAI) mit kurzer Deadline ————————————
async function llmRefine(text:string){
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_FAST_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  if(!key) return null;

  const sys = [
    "Analysiere sehr schnell und antworte NUR als kompaktes JSON.",
    `Schema: {"hints":{"level":"eu|bund|land|kommune|unsicher","region":string|null,"timeframe":"aktuell|letzte_12m|letzte_5y|seit_1990|unsicher","audience":"jugend|unternehmen|staat|senioren|unsicher","stance":"pro|contra|neutral|unsicher"}}`
  ].join("\n");
  const body:any = { model, input: `Text:\n"""${text.slice(0,2000)}"""\nNur JSON.`, instructions: sys, text:{format:{type:"json_object"}} };

  const ctrl = AbortSignal.timeout(1500); // harte 1.5s
  const r = await fetch("https://api.openai.com/v1/responses",{
    method:"POST", headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body: JSON.stringify(body), signal: ctrl
  });
  if(!r.ok) return null;
  const j = await r.json().catch(()=> ({}));
  try{
    const parsed = JSON.parse(j?.text ?? j?.output_text ?? "{}");
    return parsed?.hints || null;
  }catch{ return null; }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req:NextRequest){
  const t0=Date.now();
  const b = await req.json().catch(()=> ({}));
  const text = String(b?.text ?? "").trim();
  if(!text) return NextResponse.json({ ok:true, tookMs:0, hints:{} },{status:200});

  const ck = "clarify:"+text.slice(0,512);
  const cached = getK(ck);
  if(cached) return NextResponse.json({ ok:true, cached:true, tookMs: 0, hints: cached }, {status:200});

  const base = heuristic(text);

  // LLM parallel, aber capped via Promise.race gegen 1.6s Timer
  let refined:any = null;
  try { refined = await Promise.race([
    llmRefine(text),
    new Promise(res=> setTimeout(()=>res(null), 1600))
  ]);}catch{}

  const merged = { ...base, ...(refined||{}) };
  setK(ck, merged);
  return NextResponse.json({ ok:true, tookMs: Date.now()-t0, hints: merged }, {status:200});
}
TS

###############################################################################
# 2) Analyse-Route: harte Deadlines + Fallback, Arrays in hints erlaubt
###############################################################################
TARGET="$WEB/app/api/contributions/analyze/route.ts"; backup "$TARGET"; write "$TARGET" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as analyzeMulti } from "@/features/ai/orchestrator_contrib";
import { runOpenAI } from "@/features/ai/providers/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJson<T=any>(s:string){ try{ return JSON.parse(s) as T; }catch{ return null; } }
async function recordUsageSafe(e:any){ try{ const m=await import("@/lib/metrics/usage"); const fn=(m as any)?.recordUsage; if(typeof fn==="function") await fn(e);}catch{} }

async function extractClaimsFallback(text:string, maxClaims=3){
  const sys = `Extrahiere bis zu ${maxClaims} prägnante Claims als JSON: {"claims":[{"text":string}]}`;
  const prompt = `Text:\n"""${text.slice(0,6000)}"""\nNur JSON.`;
  const r = await runOpenAI(prompt, { json:true, system: sys, timeoutMs: 12000 });
  const json = r.ok ? safeJson<{claims?:Array<{text:string}>}>(r.text?.trim()||"") : null;
  const claims = Array.isArray(json?.claims) ? json!.claims.filter(c=>c?.text && c.text.trim()).slice(0,maxClaims) : [];
  return { claims, _meta:{ fallback:true, model: process.env.OPENAI_MODEL ?? null, tookMs: r.ms, usage: r.usage, error: r.ok? null: r.error } };
}

function forceStable(out:any, ms:number, note?:string){
  const base = { _meta:{ mode:"error", errors: note? [note]:[], tookMs: ms }, claims: [] as any[] };
  if(!out || typeof out!=="object") return base;
  if(!("_meta" in out)) return { ...base, result: out };
  if(!("claims" in out)) return { ...out, claims: [] };
  return out;
}

function normalizeHints(h:any){
  // Erlaube Arrays; primär erster Eintrag; komplette Auswahl im „other“
  const n = (v:any)=> Array.isArray(v)? v : (v==null? []:[v]);
  const out:any = {};
  const levels = n(h?.level); const regions = n(h?.region); const tfs = n(h?.timeframe); const aud = n(h?.audience); const st = n(h?.stance);
  out.level   = levels[0]   || "unsicher";
  out.region  = regions[0]  || null;
  out.timeframe = tfs[0]    || "unsicher";
  out.audience  = aud[0]    || "unsicher";
  out.stance    = st[0]     || "unsicher";
  out.other = { levels, regions, timeframes: tfs, audiences: aud, stances: st, ...(h?.other||{}) };
  return out;
}

export async function POST(req: NextRequest){
  const t0=Date.now(); let ok=false, err:string|null=null, model:string|null=null, totalTokens:number|null=null;

  try{
    const u=new URL(req.url);
    const mode = u.searchParams.get("mode") || process.env.VOG_ANALYZE_MODE || "gpt";
    const deadlineMs = Number(u.searchParams.get("deadlineMs") || 0) || undefined;
    const hardExtractMs = Number(process.env.VOG_EXTRACT_DEADLINE_MS || 10000); // 10s Kappe

    const body = await req.json().catch(()=> ({}));
    const text = String(body?.text ?? "").trim().slice(0,8000);
    const maxClaims = Math.max(1, Number(body?.maxClaims ?? 3));
    const hintsRaw  = (typeof body?.hints === "object" && body.hints) ? body.hints : null;
    const hints     = hintsRaw ? normalizeHints(hintsRaw) : null;

    if(!text){
      const ms=Date.now()-t0;
      ok=true; return NextResponse.json(forceStable(null, ms, "no-text"), {status:200});
    }

    // —— MULTI: Orchestrator (parallel, deadline) —— //
    if(mode==="multi"){
      const orches = await analyzeMulti(text, { maxClaims, deadlineMs: deadlineMs ?? 22000 }).catch(()=> null);
      const bestText = String(orches?.best?.text ?? text);

      // Claim-Extraktion hart deckeln; bei Timeout -> Fallback
      let extracted:any = null; let timedOut=false;
      try{
        extracted = await Promise.race([
          analyzeContribution(bestText, { maxClaims, hints }),
          new Promise(res=> setTimeout(()=> { timedOut=true; res("__TIMEOUT__"); }, hardExtractMs))
        ]);
      }catch{}

      if(extracted === "__TIMEOUT__" || !extracted){
        const fb = await extractClaimsFallback(bestText, maxClaims);
        extracted = { claims: fb.claims, _meta: { fallbackUsed:true, ...(fb as any)._meta } };
      }

      // Absicherung: leere Ergebnisse -> nochmals Fallback
      if(!Array.isArray(extracted?.claims) || extracted.claims.length===0){
        const fb = await extractClaimsFallback(bestText, maxClaims);
        extracted = { ...(extracted||{}), claims: fb.claims, _meta:{ ...(extracted?._meta??{}), fallbackUsed:true } };
      }

      // Dedup & trim
      const uniq = Array.from(new Set(extracted.claims.map((c:any)=> String(c?.text||"").trim()).filter(Boolean)))
                        .slice(0, maxClaims)
                        .map(t=> ({ text: t }));

      extracted.claims = uniq.length? uniq : [{ text: bestText.slice(0,280) }];

      extracted._meta = { ...(extracted._meta??{}), mode:"multi+extract", tookMs: Date.now()-t0, provider: orches?.best?.provider ?? null };
      model = (extracted?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
      totalTokens = (extracted?._meta?.usage?.total_tokens ?? null) as any;
      ok=true;
      return NextResponse.json(forceStable(extracted, extracted._meta.tookMs), {status:200});
    }

    // —— STANDARD —— //
    let out:any = null; let timed=false;
    try{
      out = await Promise.race([
        analyzeContribution(text, { maxClaims, hints }),
        new Promise(res=> setTimeout(()=> { timed=true; res("__TIMEOUT__"); }, hardExtractMs))
      ]);
    }catch{}
    if(out === "__TIMEOUT__" || !out || !Array.isArray(out?.claims) || out.claims.length===0){
      const fb = await extractClaimsFallback(text, maxClaims);
      out = { claims: fb.claims, _meta:{ ...(out?._meta??{}), fallbackUsed:true } };
    }
    out._meta = { ...(out._meta??{}), mode:"gpt", tookMs: Date.now()-t0 };
    model = (out?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
    totalTokens = (out?._meta?.usage?.total_tokens ?? null) as any;
    ok=true;
    return NextResponse.json(forceStable(out, out._meta.tookMs), {status:200});
  }catch(e:any){
    err=String(e?.message||e);
    const ms=Date.now()-t0;
    return NextResponse.json(forceStable(null, ms, err), {status:200});
  }finally{
    await recordUsageSafe({ ts:Date.now(), route:"/api/contributions/analyze", userId:null, model, totalTokens, ms: Date.now()-t0, ok, err, meta:{ source:"perf-hotfix" } });
  }
}
TS

###############################################################################
# 3) ClarifyPanel — Mehrfachauswahl + „Sonstiges“-Freitext, non-blocking
###############################################################################
TARGET="$WEB/ui/ClarifyPanel.tsx"; backup "$TARGET"; write "$TARGET" <<'TSX'
"use client";
import React from "react";

type Hints = {
  level?: string|string[];
  region?: string|string[];
  timeframe?: string|string[];
  audience?: string|string[];
  stance?: string|string[];
  other?: any;
};
function arr(v:any){ return Array.isArray(v)? v : (v==null? [] : [v]); }
function has(a:string[],v:string){ return a.includes(v); }
function toggle(a:string[],v:string){ return has(a,v)? a.filter(x=>x!==v) : [...a, v]; }

export default function ClarifyPanel({ value, onChange }:{ value:Hints; onChange:(v:Hints)=>void }){
  const [levels, setLevels] = React.useState<string[]>(arr(value?.level));
  const [regions,setRegions]= React.useState<string[]>(arr(value?.region));
  const [tfs, setTfs]       = React.useState<string[]>(arr(value?.timeframe));
  const [aud, setAud]       = React.useState<string[]>(arr(value?.audience));
  const [st, setSt]         = React.useState<string[]>(arr(value?.stance));
  const [other,setOther]    = React.useState<string>(value?.other?.free || "");

  React.useEffect(()=>{
    onChange({
      level: levels, region: regions, timeframe: tfs, audience: aud, stance: st,
      other: { ...(value?.other||{}), free: other }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, regions, tfs, aud, st, other]);

  const Chip = ({label,active,onClick}:{label:string;active:boolean;onClick:()=>void})=>(
    <button className={"vog-chip "+(active? "ring-2 ring-sky-400":"")} onClick={onClick}>{label}</button>
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-slate-500 mb-1">Ebene/Zuständigkeit (Mehrfach möglich)</div>
        <div className="flex flex-wrap gap-2">
          {["EU","Bund","Land","Kommune"].map(l=>(
            <Chip key={l} label={l} active={has(levels,l.toLowerCase())} onClick={()=> setLevels(toggle(levels, l.toLowerCase()))}/>
          ))}
          <Chip label={"Unsicher"} active={has(levels,"unsicher")} onClick={()=> setLevels(toggle(levels,"unsicher"))}/>
          <Chip label={"Sonstiges…"} active={false} onClick={()=> setOther(other)}/>
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1">Ort/Region (Mehrfach möglich)</div>
        <div className="flex flex-wrap gap-2">
          <Chip label={"Bundesweit"} active={has(regions,"bundesweit")} onClick={()=> setRegions(toggle(regions,"bundesweit"))}/>
          <Chip label={"Stadt/Region…"} active={false} onClick={()=> {
            const r = prompt("Stadt/Region angeben:"); if(r && r.trim()) setRegions([...regions, r.trim()]);
          }}/>
          <Chip label={"Unsicher"} active={has(regions,"unsicher")} onClick={()=> setRegions(toggle(regions,"unsicher"))}/>
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1">Zeitraum</div>
        <div className="flex flex-wrap gap-2">
          {[
            ["Aktuell","aktuell"],["Letzte 12 Monate","letzte_12m"],["Letzte 5 Jahre","letzte_5y"],["Seit 1990","seit_1990"],["Unsicher","unsicher"]
          ].map(([l,v])=>(
            <Chip key={v} label={l} active={has(tfs,v)} onClick={()=> setTfs(toggle(tfs, v))}/>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1">Betroffene</div>
        <div className="flex flex-wrap gap-2">
          {[
            ["Bürger*innen","buerger"],["Unternehmen","unternehmen"],["Staat/Verwaltung","staat"],["Kinder/Jugendliche","jugend"],["Rentner*innen","senioren"],["Unsicher","unsicher"]
          ].map(([l,v])=>(
            <Chip key={v} label={l} active={has(aud,v)} onClick={()=> setAud(toggle(aud, v))}/>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1">Haltung (optional)</div>
        <div className="flex flex-wrap gap-2">
          {[
            ["Pro","pro"],["Neutral","neutral"],["Contra","contra"],["Unsicher","unsicher"]
          ].map(([l,v])=>(
            <Chip key={v} label={l} active={has(st,v)} onClick={()=> setSt(toggle(st, v))}/>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1">Sonstiges (Freitext)</div>
        <input className="w-full border rounded-xl p-2 text-sm" placeholder="Optional ergänzen …"
          value={other} onChange={e=> setOther(e.target.value)} />
      </div>
    </div>
  );
}
TSX

echo "✅ Perf-Hotfix installiert. Bitte neu starten: pnpm dev (oder Seite neu laden)."
TS
