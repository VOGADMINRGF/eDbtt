#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
SRC="$APP/src"

echo "→ Root: $PWD"
test -d "$APP" || { echo "❌ $APP nicht gefunden"; exit 1; }

mkdir -p "$SRC/ui" "$SRC/app/api/contributions/analyze" "$SRC/app/api/preflight" "$SRC/app/api/quality/polish" "$SRC/lib/safety" || true

# A) Moderation komplett aus (kein Heuristik-Eingriff)
SAFE="$SRC/lib/safety/moderation.ts"
[ -f "$SAFE" ] && cp "$SAFE" "$SAFE.bak.$(date +%s)"
cat > "$SAFE" <<'TS'
export type ModerationResult = { allow: true; note: null };
export function runModeration(_: string): ModerationResult { return { allow: true, note: null }; }
TS
echo "✓ moderation.ts (no-op) geschrieben"

# B) /api/contributions/analyze robust wrappen (nie leer)
AR="$SRC/app/api/contributions/analyze/route.ts"
[ -f "$AR" ] && cp "$AR" "$AR.bak.$(date +%s)"
cat > "$AR" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { runModeration } from "@/lib/safety/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzeOut = {
  language: string|null; mainTopic: string|null; subTopics: string[];
  regionHint: string|null; claims: {text:string}[];
  organs?: any[]; trust?: any; newsroom?: any;
  weightsUpdated?: any; news: any[]; scoreHints?: any; cta: any;
  _meta: { mode:"gpt"|"ari"|"error"; errors:string[]|null; tookMs:number; gptMs?:number; ariMs?:number; gptText?:string|null };
};

function fallbackAnalyze(text:string, maxClaims:number, tookMs:number, err?:string): AnalyzeOut {
  const claims = (text? text.split(/[.!?]\s+/).filter(Boolean): [])
    .slice(0, Math.max(1, maxClaims)).map(s=>({ text: s.trim() }));
  return {
    language: null, mainTopic: null, subTopics: [], regionHint: null,
    claims, organs: [], trust: undefined, newsroom: {queries:[], angles:[], watch:[]},
    weightsUpdated: undefined, news: [], scoreHints: null, cta: null,
    _meta: { mode:"error", errors: err? [err] : ["analyzeContribution missing or failed"], tookMs }
  };
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  try{
    const body = await req.json().catch(()=>({}));
    const text = String(body?.text||"").trim();
    const maxClaims = Number(body?.maxClaims ?? 5) || 5;

    const mod = runModeration(text);
    if (!mod.allow) {
      return NextResponse.json(fallbackAnalyze(text, maxClaims, Date.now()-t0, "blocked"));
    }

    const modAnalyze = await import("@/features/analyze/analyzeContribution").catch(()=>null) as any;
    const analyzeContribution = modAnalyze?.analyzeContribution;

    if (typeof analyzeContribution === "function") {
      const out = await analyzeContribution(text, { maxClaims, context:{}, debug:false });
      if (out && typeof out === "object") {
        out._meta = { ...(out._meta||{}), tookMs: Date.now() - t0 };
        return NextResponse.json(out);
      }
    }
    return NextResponse.json(fallbackAnalyze(text, maxClaims, Date.now()-t0));
  }catch(e:any){
    return NextResponse.json(fallbackAnalyze("", 5, Date.now()-t0, String(e?.message||e)));
  }
}
TS
echo "✓ /api/contributions/analyze/route.ts ersetzt (robust)"

# C) Preflight + Polish (falls noch nicht vorhanden)
PF="$SRC/app/api/preflight/route.ts"
[ -f "$PF" ] && cp "$PF" "$PF.bak.$(date +%s)"
cat > "$PF" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function POST(req: NextRequest){
  const { text } = await req.json().catch(()=>({text:""}));
  const base = new URL(req.url);

  const similarUrl = new URL("/api/statements/similar", base);
  similarUrl.searchParams.set("text", String(text||""));

  const [similarRes, polishRes] = await Promise.all([
    fetch(similarUrl, { cache:"no-store" }).then(r=>r.json()).catch(()=>({ kind:"none" })),
    fetch(new URL("/api/quality/polish", base), {
      method:"POST", headers:{ "content-type":"application/json" }, cache:"no-store",
      body: JSON.stringify({ text })
    }).then(r=>r.json()).catch(()=>({ improved:String(text||""), notes:[], claimsHint:null }))
  ]);

  return NextResponse.json({ similar: similarRes, polish: polishRes });
}
TS
echo "✓ /api/preflight"

PL="$SRC/app/api/quality/polish/route.ts"
[ -f "$PL" ] && cp "$PL" "$PL.bak.$(date +%s)"
cat > "$PL" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
type PolishOut = { improved: string; notes: string[]; claimsHint: { count: number; split?: string[] } | null; };

export async function POST(req: NextRequest){
  const { text } = await req.json().catch(()=>({text:""}));
  const t = String(text||"").trim();
  if(!t) return NextResponse.json({ improved:"", notes:["Kein Text."], claimsHint:null });

  try{
    const mod = await import("@/core/gpt").catch(()=>null) as any;
    const callOpenAIJson = mod?.callOpenAIJson;
    if(callOpenAIJson){
      const prompt = String.raw`You are a careful German editor.
Return STRICT JSON: {"improved":string,"notes":string[],"claimsHint":{"count":number,"split":string[]}}
Tasks:
1) Rewrite input for clarity/grammar without changing meaning.
2) Give 3-6 short notes how to tighten the statement (focus, terms, measurable).
3) Estimate how many distinct claims the text contains and suggest a split as bullet strings (max 5).
TEXT:
<<<${t}>>>`;
      const { text: out } = await callOpenAIJson(prompt, 700);
      const j = JSON.parse(out||"{}");
      const safe: PolishOut = {
        improved: String(j?.improved||t),
        notes: Array.isArray(j?.notes)? j.notes.slice(0,6) : [],
        claimsHint: j?.claimsHint && typeof j.claimsHint==="object"
          ? { count: Number(j.claimsHint.count||0), split: Array.isArray(j.claimsHint.split)? j.claimsHint.split.slice(0,5):[] }
          : { count: 1, split: [t] }
      };
      return NextResponse.json(safe);
    }
  }catch(_e){}
  const sentences = t.split(/[.!?]\s+/).filter(Boolean);
  const improved = t.replace(/\s+/g," ").trim();
  const notes = [
    "Konkreter werden (Ort/Zeitraum/Betroffene).",
    "Begriffe schärfen (was genau ist gemeint?).",
    "Falls mehrere Punkte: in getrennte Aussagen teilen.",
  ];
  return NextResponse.json({ improved, notes, claimsHint: { count: sentences.length, split: sentences.slice(0,5) } });
}
TS
echo "✓ /api/quality/polish"

# D) Inline Chat-Feed + Orchestrator (mit DOM-Observer + Fetch-Instrumentation)
FEED="$SRC/ui/InlineAnalyzeFeed.tsx"
[ -f "$FEED" ] && cp "$FEED" "$FEED.bak.$(date +%s)"
cat > "$FEED" <<'TS'
"use client";
import React from "react";

export type FeedItem =
  | { type:"info"; text:string }
  | { type:"step"; text:string }
  | { type:"success"; text:string }
  | { type:"error"; text:string }
  | { type:"choices"; title:string; items:string[]; onPick:(i:number)=>void };

export default function InlineAnalyzeFeed({items}:{items:FeedItem[]}) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((it,idx)=>{
        if (it.type==="choices") {
          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white shadow p-3">
              <div className="text-sm font-medium text-slate-800 mb-2">{it.title}</div>
              <div className="flex flex-col gap-2">
                {it.items.map((t,i)=>(
                  <button key={i} onClick={()=>it.onPick(i)}
                    className="text-left rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-sm">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        const tone = it.type==="error" ? "border-rose-200 bg-rose-50"
                  : it.type==="success" ? "border-emerald-200 bg-emerald-50"
                  : it.type==="step" ? "border-sky-200 bg-sky-50"
                  : "border-slate-200 bg-white";
        return (
          <div key={idx} className={`rounded-xl border ${tone} shadow p-3 text-sm text-slate-800`}>
            {it.text}
          </div>
        );
      })}
    </div>
  );
}
TS
echo "✓ InlineAnalyzeFeed.tsx"

ORCH="$SRC/ui/ContribChatOrchestrator.tsx"
[ -f "$ORCH" ] && cp "$ORCH" "$ORCH.bak.$(date +%s)"
cat > "$ORCH" <<'TS'
"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import InlineAnalyzeFeed, { FeedItem } from "./InlineAnalyzeFeed";

function findTextarea(): HTMLTextAreaElement|null {
  const ta = document.querySelector("textarea");
  return ta as HTMLTextAreaElement|null;
}
function ensureFeedHost(ta: HTMLElement, id="vog-inline-feed-mount"): HTMLElement {
  let host = document.getElementById(id);
  if (!host) {
    host = document.createElement("div");
    host.id = id;
    host.style.marginTop = "8px";
    ta.insertAdjacentElement("afterend", host);
  }
  return host;
}
function addFallbackButton(ta: HTMLElement, onClick: ()=>void){
  if (document.getElementById("vog-inline-trigger")) return;
  const btn = document.createElement("button");
  btn.id = "vog-inline-trigger";
  btn.type = "button";
  btn.textContent = "Analyse starten (inline)";
  btn.className = "mt-2 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50";
  ta.insertAdjacentElement("afterend", btn);
  btn.addEventListener("click", onClick);
}

export default function ContribChatOrchestrator(){
  const [items, setItems] = useState<FeedItem[]>([]);
  const [host, setHost] = useState<HTMLElement|null>(null);
  const fetchPatched = useRef(false);
  const stage = useRef<"idle"|"running">("idle");
  const lastClaimDump = useRef<number>(0);

  // Mount host sobald Textarea geladen
  useEffect(()=>{
    const tryMount = ()=>{
      const ta = findTextarea();
      if (!ta) return false;
      setHost(ensureFeedHost(ta));
      // Strg+Enter als Fallback
      ta.addEventListener("keydown", (e: any)=>{
        if ((e.ctrlKey||e.metaKey) && e.key==="Enter"){
          e.preventDefault();
          runManualFlow();
        }
      });
      // Falls kein Button erkennbar, Fallback-Button setzen
      addFallbackButton(ta, runManualFlow);
      return true;
    };
    if (tryMount()) return;
    const mo = new MutationObserver(()=>{ tryMount(); });
    mo.observe(document.documentElement, { childList:true, subtree:true });
    return ()=> mo.disconnect();
  },[]);

  // Fetch-Instrumentation (einmal)
  useEffect(()=>{
    if (fetchPatched.current) return;
    fetchPatched.current = true;

    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(typeof input === "string" ? input : (input as any).url || "");
      const method = (init?.method || "GET").toUpperCase();
      const isAnalyze = /\/api\/contributions\/analyze/.test(url);
      const isPreflight = /\/api\/preflight/.test(url);
      const isStance = /\/api\/stance\/expand/.test(url);
      const isCivic = /\/api\/search\/civic/.test(url);

      const stamp = (t:string)=> setItems(prev=>[...prev, { type:"step", text:t }]);

      try{
        if (isPreflight) stamp("Prüfe ähnliche Inhalte & poliere Formulierung…");
        if (isAnalyze)   stamp("Extrahiere Claims…");
        if (isStance)    stamp("Erzeuge Lager/Varianten…");
        if (isCivic && Date.now() - lastClaimDump.current > 4000) {
          stamp("Recherche / Newsfeeds laufen…");
          lastClaimDump.current = Date.now();
        }

        const res = await origFetch(input as any, init);
        // Inhalte anhängen, ohne Originalfluss zu stören
        try{
          if (isPreflight) {
            const clone = res.clone();
            const j = await clone.json();
            if (j?.similar?.kind === "verified") {
              setItems(p=>[...p, { type:"success", text:`Verifizierter Treffer: ${j.similar.stmt?.title}` }]);
            } else if (j?.similar?.kind === "cluster") {
              const titles = (j.similar?.top||[]).map((x:any)=>x.title).join(" · ");
              setItems(p=>[...p, { type:"info", text:`Ähnliche Statements: ${titles}` }]);
            } else {
              setItems(p=>[...p, { type:"info", text:"Keine direkten Duplikate." }]);
            }
            if (j?.polish?.improved) {
              setItems(p=>[...p, { type:"success", text:`Polished: ${j.polish.improved}` }]);
            }
          }
          if (isAnalyze) {
            const clone = res.clone();
            const j = await clone.json();
            const claims = Array.isArray(j?.claims) ? j.claims.map((c:any)=>String(c?.text||"")).filter(Boolean) : [];
            if (!claims.length) {
              setItems(p=>[...p, { type:"error", text:"Keine Claims erkannt. Bitte präzisieren (Ort/Zeitraum/Betroffene)." }]);
            } else {
              setItems(p=>[...p, { type:"success", text:`${claims.length} Claim(s) erkannt.` }]);
              setItems(p=>[...p, { type:"choices", title:"Wähle Haupt-Claim", items:claims, onPick:(i:number)=>{
                setItems(p2=>[...p2, { type:"step", text:`Haupt-Claim gesetzt: ${claims[i]}` }]);
                setItems(p2=>[...p2, { type:"info", text:"Als Nächstes: Alternativen & Einwände/Essenz." }]);
              }} as any]);
            }
          }
        }catch(_e){}
        return res;
      }catch(e:any){
        setItems(prev=>[...prev, { type:"error", text:`Netzwerkfehler: ${String(e?.message||e)}` }]);
        throw e;
      }
    };
  },[]);

  // Manuelle Pipeline (falls kein eigener Knopf genutzt wird)
  async function runManualFlow(){
    if (stage.current==="running") return;
    stage.current = "running";
    setItems([{ type:"step", text:"Starte Analyse…" }]);
    const ta = findTextarea();
    const text = ta?.value?.trim() || "";

    // Preflight zuerst (zeigt sich im Feed über fetch-Instrumentation zusätzlich)
    try { await fetch("/api/preflight", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ text }) }); } catch {}

    // Danach Analyze
    try {
      await fetch("/api/contributions/analyze?mode=multi&clarify=1", {
        method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ text, maxClaims:5 })
      });
    } catch {}

    stage.current = "idle";
  }

  if (!host) return null;
  return createPortal(<InlineAnalyzeFeed items={items} />, host);
}
TS
echo "✓ ContribChatOrchestrator.tsx (DOM-Observer + fetch-Instrumentation)"

# E) In layout.tsx mounten (falls noch nicht vorhanden), HUD entfernen
LAY="$SRC/app/layout.tsx"
if [ -f "$LAY" ]; then
  cp "$LAY" "$LAY.bak.$(date +%s)"
  node - <<'NODE'
const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8');
if(!/ContribChatOrchestrator/.test(s)){
  s = s.replace(/from\s+"@\/ui\/PipelineHUD";?\n/g, '');
  s = s.replace(/import\s+PipelineHUD[^;]+;\n/g, '');
  if (!/ContribChatOrchestrator/.test(s)) {
    const ins='import ContribChatOrchestrator from "@/ui/ContribChatOrchestrator";\n';
    s = s.replace(/from\s+"@\/ui\/BodyPipelineClass";?\n/, m=> m + ins);
  }
  s = s.replace(/<BodyPipelineClass\s*\/>\s*\n/, m=> m + '        <ContribChatOrchestrator />\n');
}
s = s.replace(/\s*<PipelineHUD\s*\/>\s*\n/g, '');
fs.writeFileSync(p, s);
console.log("✓ layout.tsx gepatcht");
NODE "$LAY"
else
  echo "• Hinweis: $LAY nicht gefunden – manuell mounten"
fi

# F) Kleines CSS für sanftes Einblenden
GL="$SRC/app/globals.css"
if [ -f "$GL" ] && ! grep -q "/* vog-inline-feed2 */" "$GL"; then
  cat >> "$GL" <<'CSS'

/* vog-inline-feed2 */
#vog-inline-feed-mount > div > div { animation: vogFade2 .18s ease-in; }
@keyframes vogFade2 { from { opacity:.0; transform:translateY(2px);} to { opacity:1; transform:none; } }
CSS
  echo "✓ globals.css ergänzt"
fi

echo "→ Done. Jetzt: pnpm -F @vog/web dev neu starten"
