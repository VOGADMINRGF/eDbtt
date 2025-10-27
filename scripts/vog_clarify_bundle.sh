#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
PAGE="apps/web/src/app/contributions/new/page.tsx"
ROUTE="apps/web/src/app/api/quality/clarify/route.ts"
PANEL="apps/web/src/ui/ClarifyPanel.tsx"

ts() { date +%s; }

need_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "✗ fehlt: $f" >&2
    exit 1
  fi
}

write_safely() {
  local path="$1"
  local content="$2"
  mkdir -p "$(dirname "$path")"
  if [[ -f "$path" ]]; then
    cp -a "$path" "${path}.bak.$(ts)"
  fi
  printf "%s" "$content" > "$path"
  echo "✓ wrote: $path"
}

# 1) API-Route: /api/quality/clarify  (mit inline OpenAI call, keine Imports aufs features/… nötig)
ROUTE_SRC='
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClarifyOut = {
  detected: { region: string|null; zeitraum: string|null; zuständigkeit: string|null };
  missing: string[];
  questions: Array<{ id:string; label:string; kind:"choice"|"text"; options?:string[] }>;
  meta?: any;
};

function safe<T=any>(s:string): T | null { try{ return JSON.parse(s) as T; } catch { return null; } }

async function runOpenAIInline(prompt: string, opts: { json?: boolean; system?: string; timeoutMs?: number } = {}){
  const key=process.env.OPENAI_API_KEY;
  const model=process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  if(!key) return { ok:false, text:"", error:"OPENAI_API_KEY missing" };
  const body:any = {
    model,
    input:String(prompt||""),
    ...(opts.system ? { instructions:String(opts.system) } : {}),
    ...(opts.json ? { text:{ format:{ type:"json_object" } } } : {})
  };
  const ctrl = (opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined) as any;
  const res = await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" },
    body: JSON.stringify(body),
    signal: ctrl
  });
  if(!res.ok){
    const msg = await res.text().catch(()=> String(res.status));
    return { ok:false, text:"", error:`OpenAI ${res.status} – ${msg}` };
  }
  const data = await res.json();
  let out = "";
  if (typeof data?.text === "string") out = data.text;
  else if (Array.isArray(data?.output)) {
    out = data.output
      .flatMap((it:any)=> Array.isArray(it?.content)? it.content : [])
      .map((c:any)=> typeof c?.text === "string" ? c.text : "")
      .filter(Boolean).join("\n");
  }
  return { ok:true, text: out||"", raw:data, ms: data?.ms, usage:data?.usage };
}

export async function POST(req: NextRequest){
  const { text, claim } = await req.json().catch(()=>({}));
  const base = String(claim || text || "").slice(0,6000);
  if(!base) return NextResponse.json({ detected:{region:null,zeitraum:null,zuständigkeit:null}, missing:[], questions:[] } as ClarifyOut, {status:200});

  const sys = `Du agierst als Redakteur*in. Fasse fehlende journalistische Eckdaten als Fragen zusammen.
Rückgabe NUR als JSON:
{
  "detected": { "region": string|null, "zeitraum": string|null, "zuständigkeit": string|null },
  "missing": [ "region" | "zeitraum" | "zuständigkeit" | "quelle" | "betroffene" | "kennzahlen" ],
  "questions": [
    { "id":"region", "label":"Welche Region/Verwaltungsebene ist gemeint?", "kind":"choice",
      "options":["EU","Bund","Land","Kommune","Behörde","Stadt/Bezirk","anders"] },
    { "id":"zeitraum", "label":"Welcher Zeitraum?", "kind":"text" },
    { "id":"zuständigkeit", "label":"Wer ist zuständig (Ebene/Behörde)?", "kind":"text" }
  ]
}`;

  const prompt = "Text/Claim:\\n\"\"\""+base+"\"\"\"\\nGib NUR das JSON-Objekt zurück (keine Erklärungen).";

  const r = await runOpenAIInline(prompt, { json:true, system:sys, timeoutMs:15000 });
  if(!r.ok){
    const empty: ClarifyOut = { detected:{region:null,zeitraum:null,zuständigkeit:null}, missing:[], questions:[], meta:{ error:r.error||null } };
    return NextResponse.json(empty, {status:200});
  }
  const j = safe<ClarifyOut>(r.text?.trim()||"") || { detected:{region:null,zeitraum:null,zuständigkeit:null}, missing:[], questions:[] };
  (j as any).meta = { ...(j as any).meta, model: process.env.OPENAI_MODEL||null, tookMs: r.ms||null };
  return NextResponse.json(j, {status:200});
}
'
write_safely "$ROUTE" "$ROUTE_SRC"

# 2) UI-Panel
PANEL_SRC='
"use client";
import React from "react";

type Q = { id:string; label:string; kind:"choice"|"text"; options?:string[] };

export default function ClarifyPanel({
  text, claimText, onApply
}: { text:string; claimText:string; onApply:(ctx:any)=>void }){
  const [loading,setLoading] = React.useState(false);
  const [qs,setQs] = React.useState<Q[]>([]);
  const [vals,setVals] = React.useState<Record<string,string>>({});
  const [det,setDet] = React.useState<any>({});
  const [missing,setMissing] = React.useState<string[]>([]);
  const [err,setErr] = React.useState<string|null>(null);

  React.useEffect(()=>{
    let alive=true;
    (async()=>{
      setErr(null); setLoading(true);
      try{
        const r = await fetch("/api/quality/clarify",{
          method:"POST", headers:{ "content-type":"application/json" },
          body: JSON.stringify({ text, claim:claimText })
        });
        const j = await r.json();
        if(!alive) return;
        setQs(Array.isArray(j?.questions)? j.questions:[]);
        setDet(j?.detected||{});
        setMissing(Array.isArray(j?.missing)? j.missing:[]);
      }catch(e:any){
        if(!alive) return; setErr(String(e?.message||e));
      }finally{ if(alive) setLoading(false); }
    })();
    return ()=>{ alive=false; };
  },[text,claimText]);

  function setV(id:string,v:string){ setVals(s=>({ ...s, [id]:v })); }
  function apply(){
    const ctx = { ...det, ...vals };
    onApply(ctx);
  }

  return (
    <div className="vog-card p-4 space-y-3">
      <div className="font-semibold">Redaktion – fehlende Angaben</div>
      {loading && <div className="vog-skeleton h-3 w-24" />}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {!loading && !err && qs.length===0 && (
        <div className="text-sm text-slate-500">Aktuell keine Rückfragen.</div>
      )}
      {qs.map(q=>(
        <div key={q.id} className="space-y-1">
          <div className="text-sm">{q.label}</div>
          {q.kind==="choice" ? (
            <div className="flex flex-wrap gap-2">
              {(q.options||[]).map(o=>(
                <button key={o}
                  className={"vog-chip "+(vals[q.id]===o?"ring-2 ring-sky-400":"")}
                  onClick={()=>setV(q.id,o)}>{o}</button>
              ))}
            </div>
          ) : (
            <input className="vog-input" value={vals[q.id]||""} onChange={e=>setV(q.id,e.target.value)} />
          )}
        </div>
      ))}
      {(missing.length>0) && <div className="text-xs text-slate-500">Fehlt: {missing.join(", ")}</div>}
      <div className="flex gap-2">
        <button className="vog-btn" onClick={apply} disabled={loading}>Übernehmen</button>
      </div>
    </div>
  );
}
'
write_safely "$PANEL" "$PANEL_SRC"

# 3) Seite patchen: Import + JSX einhängen (sanft, mit .bak)
need_file "$PAGE"

# 3a) Import einfügen, falls fehlt
if ! rg -n 'import\s+ClarifyPanel\s+from\s+"@/ui/ClarifyPanel"' "$PAGE" >/dev/null 2>&1; then
  cp -a "$PAGE" "$PAGE.bak.$(ts)"
  awk 'BEGIN{done=0}
       /export default function/ && done==0 { print "import ClarifyPanel from \"@/ui/ClarifyPanel\""; print; done=1; next }
       { print }' "$PAGE" > "$PAGE.tmp" && mv "$PAGE.tmp" "$PAGE"
  echo "✓ patched import in: $PAGE"
else
  echo "• import already present in: $PAGE"
fi

# 3b) JSX-Block vor <ClaimPanelsGate …> einfügen, falls nicht vorhanden
if ! rg -n 'ClarifyPanel' "$PAGE" >/dev/null 2>&1; then
  cp -a "$PAGE" "$PAGE.bak.$(ts)"
  SNIP='
{claims.length>0 && activeClaim && (
  <ClarifyPanel
    text={text}
    claimText={activeClaim.text}
    onApply={(ctx)=>{
      setClaims(prev=>{
        const copy=[...prev];
        copy[activeClaimIdx] = {
          ...copy[activeClaimIdx],
          meta:{ ...(copy[activeClaimIdx].meta||{}), context: ctx }
        };
        return copy;
      });
    }}
  />
)}
'
  # Insert before first occurrence of <ClaimPanelsGate
  awk -v snip="$SNIP" 'BEGIN{done=0}
      /<ClaimPanelsGate/ && done==0 { print snip; print; done=1; next }
      { print }' "$PAGE" > "$PAGE.tmp" && mv "$PAGE.tmp" "$PAGE"
  echo "✓ inserted ClarifyPanel before <ClaimPanelsGate> in: $PAGE"
else
  echo "• ClarifyPanel JSX already present in: $PAGE"
fi

echo "All done."
