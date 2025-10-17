#!/usr/bin/env bash
set -euo pipefail
WEB="apps/web/src"

mkdir -p "$WEB/pipeline/steps" "$WEB/pipeline" "$WEB/lib" "$WEB/components/analyze" "$WEB/app/contributions/analyze" "$WEB/app/api/contributions/analyze/stream"

# ---------- lib: utils ----------
cat > "$WEB/lib/analysis.ts" <<'TS'
import crypto from "crypto";
export function sha256(s:string){ return crypto.createHash("sha256").update(s).digest("hex"); }
export function guessLang(text:string){
  const de = (text.match(/\b(und|nicht|auch|oder|weil|dass|ß|ä|ö|ü)\b/gi)||[]).length;
  const en = (text.match(/\b(and|the|of|to|in|is|that|with)\b/gi)||[]).length;
  return de>=en ? "de" : "en";
}
export function extractUrls(text:string){ return Array.from(new Set(text.match(/\bhttps?:\/\/[^\s)]+/gi)||[])); }

export function heuristicAnalyze(text:string){
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,40);
  const words = (text.toLowerCase().match(/[a-zäöüß\-]+/gi)??[]).slice(0,2000);
  const stop = new Set(["und","der","die","das","mit","im","in","es","ein","eine","zu","von","ist","an","den","dem","des","oder","auch","nicht","für","auf","sich","wie","bei","man","wir","ich","aber"]);
  const freq = new Map<string, number>(); for(const w of words) if(!stop.has(w)) freq.set(w,(freq.get(w)??0)+1);
  const topics = [...freq.entries()].filter(([,c])=>c>1).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([topic,c],i)=>({ topic: topic.replace(/^\w/,m=>m.toUpperCase()), score: Math.max(0, Math.min(1, 0.65 - i*0.07 + c/Math.max(8, words.length/80))) )}));
  const marker = /(muss|sollte|fordert|braucht|ist\s+notwendig|es\s+bedarf|wird\s+erwartet|unzumutbar|nicht\s+vertretbar)/i;
  const theses = sentences.filter(s=>marker.test(s)||s.length>120).slice(0,4)
    .map((t,i)=>({ text:t.trim(), relevance: Math.max(0.6-i*0.1,0.3), domain:"Allgemein" }));
  const statements = (theses.length? theses.map(t=>({text:t.text})) : sentences.slice(0,3).map(t=>({text:t})));
  const summary = { topics: topics.length, theses: theses.length, avgRelevance: Math.round((theses.reduce((a,b)=>a+(b.relevance||0),0)/(theses.length||1))*100) };
  return { topics, theses, statements, summary };
}
TS

cat > "$WEB/lib/llm.ts" <<'TS'
import OpenAI from "openai";
const model = process.env.OPENAI_MODEL || "gpt-5.0";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeWithGptJSON(text:string){
  const SYSTEM = `Du bist ein präziser Politik/News-Analyst. Antworte NUR mit JSON:
{"topics":[{"topic":string,"score":number}],"theses":[{"text":string,"relevance":number,"domain":string}],
"statements":[{"text":string}],"summary":{"topics":number,"theses":number,"avgRelevance":number}}`;
  const USER = `Text:\n---\n${text}\n---`;
  const r = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [{role:"system",content:SYSTEM},{role:"user",content:USER}]
  });
  return JSON.parse(r.choices?.[0]?.message?.content || "{}");
}
TS

# ---------- pipeline core ----------
cat > "$WEB/pipeline/types.ts" <<'TS'
export type StepSend = (event:string, data:any)=>void;
export type StepContext = {
  text: string;
  lang?: string;
  urls?: string[];
  data: Record<string, any>;
  result?: { topics:any[]; theses:any[]; statements:any[]; summary:any };
};
export type StepDefinition = {
  id: string;
  label: string;
  when?: (ctx: StepContext)=>boolean;
  run: (ctx: StepContext, send: StepSend)=>Promise<void|Partial<StepContext>>;
};
TS

cat > "$WEB/pipeline/util.ts" <<'TS'
export const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));
const safeNum = (n:any)=> Number.isFinite(n)? n : 0;
export function pipeResult(send:(e:string,d:any)=>void, r:any){
  const topics = (r.topics||[]).map((t:any)=>({ topic:t.topic, score: safeNum(t.score) }));
  const theses = (r.theses||[]).map((t:any)=>({ text:t.text, relevance: safeNum(t.relevance), domain: t.domain||"Allgemein" }));
  const statements = (r.statements||[]).map((s:any)=>({ text:s.text }));
  const summary = { topics: topics.length, theses: theses.length,
    avgRelevance: Math.round((theses.reduce((a:number,b:any)=>a + safeNum(b.relevance)*100,0)/Math.max(1,theses.length))) };
  send("summary", summary); send("topics", topics); send("theses", theses); send("statements", statements);
}
TS

cat > "$WEB/pipeline/registry.ts" <<'TS'
import { StepDefinition, StepContext, StepSend } from "./types";
import { defaultSteps } from "./manifest";

export async function runPipeline(baseCtx: StepContext, send: StepSend, steps?:StepDefinition[]){
  const stack = steps || defaultSteps;
  let ctx = baseCtx;
  for (const step of stack){
    if (step.when && !step.when(ctx)) continue;
    send("status", { step: step.id, msg: step.label, start: true });
    const delta = await step.run(ctx, send);
    ctx = { ...ctx, ...(delta||{}), data: { ...(ctx.data||{}), ...((delta||{}).data||{}) } };
    send("status", { step: step.id, msg: step.label, end: true });
  }
  return ctx;
}
TS

cat > "$WEB/pipeline/manifest.ts" <<'TS'
import type { StepDefinition } from "./types";
import { preprocess } from "./steps/preprocess";
import { cacheStep } from "./steps/cache";
import { analyzeGpt } from "./steps/analyze_gpt";
import { heuristic } from "./steps/heuristic";
import { confirmStep } from "./steps/confirm";
import { factcheckStub } from "./steps/factcheck_stub";
import { finalizeStep } from "./steps/finalize";

export const allSteps: Record<string, StepDefinition> = {
  preprocess, cache: cacheStep, gpt: analyzeGpt, heuristic, confirm: confirmStep, factcheck: factcheckStub, finalize: finalizeStep
};

export const defaultOrder = ["preprocess","cache","gpt","heuristic","confirm","factcheck","finalize"];
export const defaultSteps: StepDefinition[] = defaultOrder.map(k=>allSteps[k]);
export function selectStepsFromParam(param?:string|null){
  if(!param) return defaultSteps;
  const ids = param.split(",").map(s=>s.trim()).filter(Boolean);
  const uniq = Array.from(new Set(ids)).filter(id=>allSteps[id]);
  return uniq.length? uniq.map(id=>allSteps[id]) : defaultSteps;
}
TS

# ---------- steps ----------
cat > "$WEB/pipeline/steps/preprocess.ts" <<'TS'
import type { StepDefinition } from "../types";
import { extractUrls, guessLang } from "@/lib/analysis";
import { sleep } from "../util";

export const preprocess: StepDefinition = {
  id: "preprocess",
  label: "Vorverarbeitung",
  async run(ctx, send){
    const lang = guessLang(ctx.text);
    const urls = extractUrls(ctx.text);
    send("data", { kind: "pre", lang, urls });
    await sleep(80);
    return { lang, urls };
  }
};
TS

cat > "$WEB/pipeline/steps/cache.ts" <<'TS'
import type { StepDefinition } from "../types";
import { pipeResult } from "../util";
import { sha256 } from "@/lib/analysis";

const mem = new Map<string, any>();
const keyOf = (text:string)=> sha256(text + "|" + (process.env.OPENAI_MODEL||"gpt-5.0"));

export const cacheStep: StepDefinition = {
  id: "cache",
  label: "Cache prüfen",
  async run(ctx, send){
    const key = keyOf(ctx.text);
    if (mem.has(key)){
      const r = mem.get(key);
      send("status", { step: "cache", msg: "Treffer – nutze Cache" });
      pipeResult(send, r);
      return { result: r, data: { cacheKey: key, cached: true } };
    }
    return { data: { cacheKey: key, cached: false } };
  }
};

export function putCache(key:string, value:any){ mem.set(key, value); }
TS

cat > "$WEB/pipeline/steps/analyze_gpt.ts" <<'TS'
import type { StepDefinition } from "../types";
import { analyzeWithGptJSON } from "@/lib/llm";
import { pipeResult } from "../util";
import { putCache } from "./cache";

export const analyzeGpt: StepDefinition = {
  id: "gpt",
  label: "Analyse (GPT)",
  when(ctx){ return !ctx.data?.cached; },
  async run(ctx, send){
    try{
      const r = await analyzeWithGptJSON(ctx.text);
      if (r && (Array.isArray(r.topics)||Array.isArray(r.theses))){
        pipeResult(send, r);
        if (ctx.data?.cacheKey) putCache(ctx.data.cacheKey, r);
        return { result: r };
      }
    }catch{}
    return {};
  }
};
TS

cat > "$WEB/pipeline/steps/heuristic.ts" <<'TS'
import type { StepDefinition } from "../types";
import { heuristicAnalyze } from "@/lib/analysis";
import { pipeResult } from "../util";
import { putCache } from "./cache";

export const heuristic: StepDefinition = {
  id: "heuristic",
  label: "Fallback-Heuristik",
  when(ctx){ return !ctx.result; },
  async run(ctx, send){
    const r = heuristicAnalyze(ctx.text);
    pipeResult(send, r);
    if (ctx.data?.cacheKey) putCache(ctx.data.cacheKey, r);
    return { result: r };
  }
};
TS

cat > "$WEB/pipeline/steps/confirm.ts" <<'TS'
import type { StepDefinition } from "../types";
import { sleep } from "../util";

export const confirmStep: StepDefinition = {
  id: "confirm",
  label: "Bestätigung",
  async run(_ctx, send){
    send("confirm", { msg: "Passen Themen/Kernaussagen? Du kannst jetzt korrigieren oder wir machen weiter." });
    await sleep(400); // auto-continue; echter Stop erfordert extra POST/WS
  }
};
TS

cat > "$WEB/pipeline/steps/factcheck_stub.ts" <<'TS'
import type { StepDefinition } from "../types";

export const factcheckStub: StepDefinition = {
  id: "factcheck",
  label: "Faktencheck (Stub)",
  when(ctx){ return !!ctx.result; },
  async run(ctx, send){
    const base = ctx.result?.theses?.length? ctx.result.theses : ctx.result?.statements || [];
    const facts = base.slice(0,3).map((t:any,i:number)=>({
      claim: t.text, verdict: i%2===0? "stützt":"widerspricht", confidence: 60+i*10
    }));
    send("factcheck", { facts });
  }
};
TS

cat > "$WEB/pipeline/steps/finalize.ts" <<'TS'
import type { StepDefinition } from "../types";
export const finalizeStep: StepDefinition = {
  id: "finalize",
  label: "Abschluss",
  async run(_ctx, send){ send("done", {}); }
};
TS

# ---------- API route (SSE) ----------
cat > "$WEB/app/api/contributions/analyze/stream/route.ts" <<'TS'
import { NextRequest } from "next/server";
import { runPipeline } from "@/pipeline/registry";
import { selectStepsFromParam } from "@/pipeline/manifest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text")||"").trim();
  const stepsParam = searchParams.get("steps");

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller){
      const send = (event:string, data:any)=>
        controller.enqueue(enc.encode(`event:${event}\ndata:${JSON.stringify(data)}\n\n`));
      try{
        if(!text){ send("error",{msg:"Kein Text übergeben."}); controller.close(); return; }
        const steps = selectStepsFromParam(stepsParam);
        // stelle die definierten Steps an den Client vor:
        send("manifest", { steps: steps.map(s=>({id:s.id,label:s.label})) });
        await runPipeline({ text, data:{} }, send, steps);
      }catch(e:any){ send("error", { msg: e?.message || "Unbekannter Fehler" }); }
      finally{ controller.close(); }
    }
  });

  return new Response(stream, { headers: {
    "Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform","Connection":"keep-alive"
  }});
}
TS

# ---------- UI (dynamic & flexible) ----------
cat > "$WEB/components/analyze/AnalyzeUI.tsx" <<'TSX'
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type StepMeta = { id:string; label:string };
type Topic = { topic: string; score: number };
type Thesis = { text:string; relevance?:number; domain?:string };
type Statement = { text:string };

export default function AnalyzeUI(){
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepMeta[]>([]);
  const [status, setStatus] = useState<Array<{step:string;msg:string;start?:boolean;end?:boolean}>>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]|null>(null); // manual selection

  const orderedSteps = useMemo(()=> (selected? selected : steps.map(s=>s.id)), [steps, selected]);
  const stepOk = (id:string)=> status.some(s=>s.step===id && s.end);

  function start(){
    if(!text.trim()||running) return;
    setRunning(true);
    setStatus([]); setTopics([]); setTheses([]); setStatements([]); setFacts([]); setSummary(null);
    const param = (selected && selected.length) ? `&steps=${encodeURIComponent(selected.join(","))}` : "";
    const es = new EventSource(`/api/contributions/analyze/stream?text=${encodeURIComponent(text)}${param}`);

    es.addEventListener("manifest",(e:any)=>{ const m = JSON.parse(e.data); setSteps(m.steps||[]); });
    es.addEventListener("status",(e:any)=> setStatus(prev=>[...prev, JSON.parse(e.data)]));
    es.addEventListener("summary",(e:any)=> setSummary(JSON.parse(e.data)));
    es.addEventListener("topics",(e:any)=> setTopics(JSON.parse(e.data)));
    es.addEventListener("theses",(e:any)=> setTheses(JSON.parse(e.data)));
    es.addEventListener("statements",(e:any)=> setStatements(JSON.parse(e.data)));
    es.addEventListener("factcheck",(e:any)=> setFacts(JSON.parse(e.data).facts||[]));
    es.addEventListener("error",()=>{ es.close(); setRunning(false); });
    es.addEventListener("done", ()=>{ es.close(); setRunning(false); });
  }

  function toggle(id:string){
    setSelected(prev=>{
      const base = prev ?? steps.map(s=>s.id);
      return base.includes(id) ? base.filter(x=>x!==id) : [...base, id];
    });
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <header className="mb-3">
        <h1 className="text-3xl font-serif">Beitrag erstellen & analysieren</h1>
        <p className="text-sm text-neutral-600">Modulare Pipeline – Reihenfolge & Schritte sind frei konfigurierbar.</p>
      </header>

      <textarea className="w-full h-40 border p-2 font-mono" value={text} onChange={e=>setText(e.target.value)} placeholder="Text oder Links einfügen…" />

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button onClick={start} disabled={running||!text.trim()} className="px-3 py-1 border rounded disabled:opacity-50">
          {running ? "Analysiere…" : "Analyse starten"}
        </button>

        <details className="ml-auto">
          <summary className="cursor-pointer">Erweitert: Schritte wählen</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {(steps.length? steps : [{id:"preprocess",label:"Vorverarbeitung"},{id:"cache",label:"Cache"},{id:"gpt",label:"GPT"},{id:"heuristic",label:"Heuristik"},{id:"confirm",label:"Bestätigung"},{id:"factcheck",label:"Faktencheck"},{id:"finalize",label:"Fertig"}]).map(s=>(
              <label key={s.id} className="inline-flex items-center gap-1 text-sm border px-2 py-1 rounded">
                <input type="checkbox" checked={(selected??steps.map(x=>x.id)).includes(s.id)} onChange={()=>toggle(s.id)} />
                {s.label}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="mt-3 border rounded overflow-hidden">
        <div className="bg-neutral-50 p-2 flex flex-wrap items-center gap-3">
          {orderedSteps.map(id=> <StepChip key={id} id={id} ok={stepOk(id)} />)}
          {summary && <span className="ml-auto text-sm">Ø Relevanz ~ {summary?.avgRelevance||0}%</span>}
        </div>

        <Panel title="Überblick">
          {summary ? (
            <div><b>Themen:</b> {topics.map(t=>t.topic).join(", ")||"—"} • <b>Thesen:</b> {theses.length} • <b>Ø Relevanz:</b> {summary.avgRelevance||0}%</div>
          ) : <i>Warte auf Modell…</i>}
        </Panel>

        <Panel title="Themen">
          <ul className="list-disc pl-6">
            {topics.map((t,i)=><li key={i}>{t.topic} ({Math.round((t.score||0)*100)}%)</li>)}
          </ul>
        </Panel>

        <Panel title="Thesen">
          <ul className="list-disc pl-6">
            {theses.map((t,i)=><li key={i}>{t.text} {!!t.domain && <em className="text-neutral-500">[{t.domain}]</em>} {t.relevance!=null && <span>({Math.round((t.relevance||0)*100)}%)</span>}</li>)}
          </ul>
        </Panel>

        <Panel title="Kernaussagen">
          <ul className="list-disc pl-6">
            {statements.map((s,i)=><li key={i}>{s.text}</li>)}
          </ul>
        </Panel>

        {!!facts.length && (
          <Panel title="Faktencheck">
            <ul className="list-disc pl-6">
              {facts.map((f,i)=><li key={i}><b>{f.verdict}</b> – {f.claim} <span className="text-neutral-500">({f.confidence}%)</span></li>)}
            </ul>
          </Panel>
        )}

        <Panel title="Status / Logs">
          <ul className="list-disc pl-6">
            {status.map((s,i)=><li key={i}>{s.step}: {s.msg} {s.end?"✓":s.start?"…":""}</li>)}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({title, children}:{title:string;children:any}){
  return (
    <section className="border-t">
      <header className="bg-neutral-50 p-2 font-medium">{title}</header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function StepChip({id, ok}:{id:string;ok:boolean}){
  const label = ({preprocess:"Vorverarbeitung",cache:"Cache",gpt:"GPT",heuristic:"Heuristik",confirm:"Bestätigung",factcheck:"Faktencheck",finalize:"Fertig"} as any)[id] || id;
  return (
    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm " + (ok?"bg-green-100 text-green-800":"bg-neutral-100 text-neutral-700")}>
      <span className={"w-2 h-2 rounded-full " + (ok?"bg-green-600":"bg-neutral-400")} />
      {label}
    </span>
  );
}
TSX

cat > "$WEB/app/contributions/analyze/page.tsx" <<'TSX'
import AnalyzeUI from "@/components/analyze/AnalyzeUI";
export const dynamic = "force-dynamic";
export default function Page(){ return <AnalyzeUI />; }
TSX

echo "✅ Flexible Pipeline installiert."
echo "Run:"
echo "pnpm --filter @vog/web run dev"
