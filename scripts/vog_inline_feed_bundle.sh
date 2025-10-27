#!/usr/bin/env bash
set -euo pipefail

ROOT="${PWD}"
APP="apps/web"
SRC="$APP/src"

echo "→ Root: $ROOT"
test -d "$APP" || { echo "❌ $APP nicht gefunden"; exit 1; }

mkdir -p "$SRC/ui" "$SRC/lib/safety" "$SRC/app/api/quality/polish" "$SRC/app/api/preflight" "$SRC/app/api/contributions/analyze" || true

# ──────────────────────────────────────────────────────────────────────────────
# A) Moderation komplett AUS (kein Heuristik-Eingriff)
# ──────────────────────────────────────────────────────────────────────────────
SAFE="$SRC/lib/safety/moderation.ts"
[ -f "$SAFE" ] && cp "$SAFE" "$SAFE.bak.$(date +%s)"
cat > "$SAFE" <<'TS'
export type ModerationResult = { allow: true; note: null };
export function runModeration(_: string): ModerationResult {
  return { allow: true, note: null };
}
TS
echo "  ✓ moderation: disabled (no heuristics)"

# ──────────────────────────────────────────────────────────────────────────────
# B) Robustere /api/contributions/analyze  (fällt nie ins Leere)
#    - nutzt vorhandenes features/analyze/analyzeContribution, wenn vorhanden
#    - ansonsten Fallback (Satzsplit), mit _meta.mode="error"
# ──────────────────────────────────────────────────────────────────────────────
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
    .slice(0, Math.max(1, maxClaims))
    .map(s=>({ text: s.trim() }));
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

    // Moderation komplett off (immer allow) – siehe moderation.ts
    const mod = runModeration(text);
    if (!mod.allow) {
      return NextResponse.json(fallbackAnalyze(text, maxClaims, Date.now()-t0, "blocked"), { status: 200 });
    }

    // Versuche dein eigentliches Analyze-Modul zu nutzen
    const modAnalyze = await import("@/features/analyze/analyzeContribution").catch(()=>null) as any;
    const analyzeContribution = modAnalyze?.analyzeContribution;

    if (typeof analyzeContribution === "function") {
      const out = await analyzeContribution(text, { maxClaims, context:{}, debug:false });
      // Meta anreichern, aber Schema beibehalten
      if (out && typeof out === "object") {
        out._meta = { ...(out._meta||{}), tookMs: Date.now() - t0 };
        return NextResponse.json(out);
      }
    }
    // Fallback
    return NextResponse.json(fallbackAnalyze(text, maxClaims, Date.now()-t0));
  }catch(e:any){
    return NextResponse.json(fallbackAnalyze("", 5, Date.now()-t0, String(e?.message||e)), { status: 200 });
  }
}
TS
echo "  ✓ /api/contributions/analyze: safe wrapper gesetzt"

# ──────────────────────────────────────────────────────────────────────────────
# C) Preflight (Polish + Similar Aggregat)  & Polish-API
# ──────────────────────────────────────────────────────────────────────────────
PF="$SRC/app/api/preflight/route.ts"
[ -f "$PF" ] && cp "$PF" "$PF.bak.$(date +%s)"
cat > "$PF" <<'TS'
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
echo "  ✓ /api/preflight bereit"

PL="$SRC/app/api/quality/polish/route.ts"
[ -f "$PL" ] && cp "$PL" "$PL.bak.$(date +%s)"
cat > "$PL" <<'TS'
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PolishOut = {
  improved: string;
  notes: string[];
  claimsHint: { count: number; split?: string[] } | null;
};

export async function POST(req: NextRequest){
  const { text } = await req.json().catch(()=>({text:""}));
  const t = String(text||"").trim();
  if(!t) return NextResponse.json({ improved:"", notes:["Kein Text."], claimsHint:null });

  // Optional: falls du ein GPT-Helpermodul hast (ansonsten Fallback)
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
  }catch(_e){/* fallback unten */ }

  // Fallback: simple Heuristik
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
echo "  ✓ /api/quality/polish bereit"

# ──────────────────────────────────────────────────────────────────────────────
# D) Inline Analyse-Feed (Chat-Stil, direkt unter dem Editor)
# ──────────────────────────────────────────────────────────────────────────────
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
echo "  ✓ InlineAnalyzeFeed.tsx erstellt"

# ──────────────────────────────────────────────────────────────────────────────
# E) Orchestrator: hookt den „Analysieren“-Klick und streamt Schritte in den Feed
# ──────────────────────────────────────────────────────────────────────────────
ORCH="$SRC/ui/ContribChatOrchestrator.tsx"
[ -f "$ORCH" ] && cp "$ORCH" "$ORCH.bak.$(date +%s)"
cat > "$ORCH" <<'TS'
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import InlineAnalyzeFeed, { FeedItem } from "./InlineAnalyzeFeed";

function findEditor(): HTMLTextAreaElement|null {
  const ta = document.querySelector("textarea");
  return ta as HTMLTextAreaElement | null;
}
function ensureMountAfter(el: HTMLElement, id="vog-inline-feed-mount"): HTMLElement {
  let host = document.getElementById(id);
  if (!host) {
    host = document.createElement("div");
    host.id = id;
    host.style.marginTop = "8px";
    el.insertAdjacentElement("afterend", host);
  }
  return host;
}

export default function ContribChatOrchestrator(){
  const [items, setItems] = useState<FeedItem[]>([]);
  const [mountedEl, setMountedEl] = useState<HTMLElement|null>(null);
  const on = useRef(false);

  // Mount unter dem Editor vorbereiten
  useEffect(()=>{
    const ta = findEditor();
    if (!ta) return;
    const host = ensureMountAfter(ta);
    setMountedEl(host);
  },[]);

  // Klick auf "Analysieren/Analyse starten" abfangen
  useEffect(()=>{
    if (on.current) return;
    const btn = Array.from(document.querySelectorAll("button,a"))
      .find(el=>/analysieren|analyse starten/i.test(el.textContent||""));
    if (!btn) return;
    on.current = true;
    const handler = async (e: Event)=>{
      e.preventDefault();
      const ta = findEditor();
      const text = ta?.value?.trim() || "";
      if (!text) return;

      setItems([{ type:"step", text:"Starte Analyse…" }]);

      // 1) Preflight
      setItems(prev=>[...prev, { type:"step", text:"Prüfe ähnliche Inhalte & poliere Formulierung…" }]);
      let preflight: any = null;
      try{
        preflight = await fetch("/api/preflight", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ text }) })
          .then(r=>r.json());
        const sim = preflight?.similar?.kind;
        if (sim==="verified") {
          setItems(prev=>[...prev, { type:"success", text:`Verifizierter Treffer gefunden: ${preflight.similar?.stmt?.title}` }]);
        } else if (sim==="cluster") {
          const titles = (preflight.similar?.top||[]).map((t:any)=>t.title).join(" · ");
          setItems(prev=>[...prev, { type:"info", text:`Ähnliche Statements vorhanden: ${titles}` }]);
        } else {
          setItems(prev=>[...prev, { type:"info", text:"Keine direkten Duplikate." }]);
        }
        if (preflight?.polish?.improved) {
          setItems(prev=>[...prev, { type:"success", text:`Polished: ${preflight.polish.improved}` }]);
        }
      }catch(e:any){
        setItems(prev=>[...prev, { type:"error", text:`Preflight fehlgeschlagen: ${String(e?.message||e)}` }]);
      }

      // 2) Claims extrahieren (robuste Route)
      setItems(prev=>[...prev, { type:"step", text:"Extrahiere Claims…" }]);
      try{
        const res = await fetch("/api/contributions/analyze?mode=multi&clarify=1", {
          method:"POST", headers:{ "content-type":"application/json" },
          body: JSON.stringify({ text, maxClaims: 5 })
        });
        const data = await res.json();
        const claims = Array.isArray(data?.claims) ? data.claims.map((c:any)=>String(c?.text||"")).filter(Boolean) : [];
        if (!claims.length) {
          setItems(prev=>[...prev, { type:"error", text:"Keine Claims erkannt. Bitte präziser formulieren (Ort/Zeitraum/Betroffene)." }]);
          return;
        }
        setItems(prev=>[...prev, { type:"success", text:`${claims.length} Claim(s) erkannt.` }]);
        setItems(prev=>[...prev, { type:"choices",
          title: "Wähle Haupt-Claim",
          items: claims,
          onPick: (i:number)=>{
            setItems(p=>[...p, { type:"step", text:`Haupt-Claim gesetzt: ${claims[i]}` }]);
            // Optional: hier Alternativen/Einwände nachschalten
            setItems(p=>[...p, { type:"info", text:"Als Nächstes: Alternativen (Lager-Spektrum) & Einwände/Essenz." }]);
          }
        } as any]);
      }catch(e:any){
        setItems(prev=>[...prev, { type:"error", text:`Claims fehlgeschlagen: ${String(e?.message||e)}` }]);
      }
    };
    btn?.addEventListener("click", handler);
    return ()=> btn?.removeEventListener("click", handler);
  },[]);

  if (!mountedEl) return null;
  return createPortal(<InlineAnalyzeFeed items={items} />, mountedEl);
}
TS
echo "  ✓ ContribChatOrchestrator.tsx erstellt"

# ──────────────────────────────────────────────────────────────────────────────
# F) In layout.tsx: Inline-Feed mounten, HUD (falls vorhanden) entfernen
# ──────────────────────────────────────────────────────────────────────────────
LAY="$SRC/app/layout.tsx"
if [ -f "$LAY" ]; then
  cp "$LAY" "$LAY.bak.$(date +%s)"
  node - <<'NODE'
const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8');
if(!/ContribChatOrchestrator/.test(s)){
  s = s.replace(/from\s+"@\/ui\/BodyPipelineClass";?\n/, m=> m + 'import ContribChatOrchestrator from "@/ui/ContribChatOrchestrator";\n');
  s = s.replace(/<BodyPipelineClass\s*\/>\s*\n/, m=> m + '        <ContribChatOrchestrator />\n');
}
s = s.replace(/import\s+PipelineHUD[^;]+;\n/g, '');
s = s.replace(/\s*<PipelineHUD\s*\/>\s*\n/g, '');
fs.writeFileSync(p, s);
console.log("  ✓ layout.tsx gepatcht (Inline-Feed gemountet, HUD entfernt)");
NODE "$LAY"
else
  echo "  • Hinweis: $LAY nicht gefunden – manuelles Mounten ggf. nötig"
fi

# ──────────────────────────────────────────────────────────────────────────────
# G) Minimal CSS (schöne Boxen)
# ──────────────────────────────────────────────────────────────────────────────
GL="$SRC/app/globals.css"
if [ -f "$GL" ]; then
  grep -q "/* vog-inline-feed */" "$GL" || cat >> "$GL" <<'CSS'

/* vog-inline-feed */
#vog-inline-feed-mount > div > div { animation: vogFade .2s ease-in; }
@keyframes vogFade { from { opacity:.0; transform:translateY(3px);} to { opacity:1; transform:none; } }
CSS
  echo "  ✓ globals.css ergänzt"
fi

echo "→ Fertig. Starte dev neu: pnpm -F @vog/web dev"
