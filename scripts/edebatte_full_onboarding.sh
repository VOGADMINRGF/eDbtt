#!/usr/bin/env bash
set -euo pipefail

# Root ermitteln
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  ROOT="$(git rev-parse --show-toplevel)"
else
  ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
fi
echo "→ Root: $ROOT"

APP_WEB="$ROOT/apps/web"
SRC="$APP_WEB/src"
CMP="$SRC/components"
ANZ="$CMP/analyze"
LIB="$SRC/lib"
CFG="$SRC/config"
API="$SRC/app/api"

mkdir -p "$ANZ" "$LIB" "$CFG" "$SRC/app" \
         "$SRC/app/contributions/new" "$SRC/app/contributions/analyze" \
         "$SRC/app/demo/pitch" \
         "$API/statements/similar" "$API/qualify/start" "$API/autopilot/start" "$API/stance/expand"

echo "→ Dev-Deps Tailwind v4 & Plugins (workspace)…"
pnpm add -D -w tailwindcss@^4 @tailwindcss/postcss @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio >/dev/null

echo "→ Tailwind/PostCSS konfigurieren…"
# tailwind.config.ts (ESM/TS, v4)
cat > "$APP_WEB/tailwind.config.ts" <<'TS'
import type { Config } from "tailwindcss";
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../features/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: { brand: { from: "#00E6D1", to: "#2196F3" } },
      borderRadius: { "2xl": "1rem" },
    },
  },
} satisfies Config;
TS
rm -f "$APP_WEB/tailwind.config.cjs" 2>/dev/null || true

# postcss.config.cjs (nur das v4-Plugin)
cat > "$APP_WEB/postcss.config.cjs" <<'CJS'
module.exports = { plugins: { "@tailwindcss/postcss": {} } };
CJS

echo "→ Globalstyles & CI-Helfer…"
mkdir -p "$SRC/app"
[ -f "$SRC/app/globals.css" ] && cp "$SRC/app/globals.css" "$SRC/app/globals.css.bak" || true
cat > "$SRC/app/globals.css" <<'CSS'
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/aspect-ratio";

/* CI-Helpers */
:root { --page-max: 1100px; }
.container-vog { max-width: var(--page-max); margin: 0 auto; padding: 1rem; }
.vog-head { 
  font-size: clamp(1.875rem, 2vw + 1rem, 2.25rem); font-weight: 800; letter-spacing: -0.02em;
  background: linear-gradient(90deg, #00E6D1 0%, #2196F3 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.vog-card       { border-radius: 1rem; border: 1px solid rgba(226,232,240,.8); background: #fff; box-shadow: 0 8px 24px rgba(2,6,23,.06); }
.vog-card-muted { border-radius: 1rem; border: 1px solid rgba(226,232,240,.8); background: rgba(248,250,252,.7); }
.vog-btn        { display:inline-flex; align-items:center; justify-content:center; border-radius:1rem; padding:.625rem .875rem; font-size:.875rem; border:1px solid #CBD5E1; background:#fff; }
.vog-btn:hover  { background:#F1F5F9; }
.vog-btn-pri    { display:inline-flex; align-items:center; justify-content:center; border-radius:1rem; padding:.625rem 1rem; font-weight:600; font-size:.9rem; color:#fff; background: linear-gradient(90deg, #00E6D1 0%, #2196F3 100%); }
.vog-btn-ghost  { display:inline-flex; align-items:center; justify-content:center; border-radius:1rem; padding:.5rem .75rem; font-size:.875rem; color:#334155; }
.vog-chip       { display:inline-flex; align-items:center; border-radius:9999px; padding:.125rem .5rem; font-size:.75rem; border:1px solid #E2E8F0; background:#F8FAFC; color:#475569; }
.vog-stepper    { display:flex; align-items:center; gap:.5rem; font-size:.75rem; color:#64748B;}
.vog-stepper .dot{ width:.5rem; height:.5rem; border-radius:9999px; background:#CBD5E1;}
.vog-stepper .dot.active{ background:#0EA5E9;}
.vog-skeleton   { animation:pulse 1.5s ease-in-out infinite; background: #E2E8F0; border-radius:.375rem; }
@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

/* Fallback für line-clamp-2 */
.tw-fallback-line-clamp-2{
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
CSS

echo "→ Feature-Flags…"
cat > "$CFG/flags.ts" <<'TS'
export const FLAGS = {
  PITCH_MODE: true,
  ENABLE_COINS: true,
  ENABLE_AUTOPILOT: true,
  MAX_CLAIMS_PUBLIC: 4,
  MAX_CLAIMS_PRO: 6,
};
TS

echo "→ Lib: Claim-Match…"
cat > "$LIB/claimMatch.ts" <<'TS'
export type VerifiedHit = { id:string; title:string; trust:number; version:number; evidenceCount:number; sim:number };
export type ClusterHit = { id:string; title:string; trust:number; evidenceCount:number; sim:number };
export type ClaimMatch =
  | { kind:"verified"; stmt: VerifiedHit }
  | { kind:"cluster"; top: ClusterHit[]; clusterId: string }
  | { kind:"none" };

export async function getClaimMatch(text: string): Promise<ClaimMatch> {
  try {
    const r = await fetch("/api/statements/similar?text="+encodeURIComponent(text));
    if (!r.ok) return { kind:"none" };
    return await r.json();
  } catch { return { kind:"none" }; }
}
TS

echo "→ Analyze-Komponenten (CTA/Result/News/Clarify)…"
cat > "$ANZ/CTAButtons.tsx" <<'TS'
"use client";
import React from "react";
export default function CTAButtons({ onUse, onAlternatives, onResearch, onFactcheck }:{
  onUse: ()=>void; onAlternatives: ()=>void; onResearch: ()=>void; onFactcheck: ()=>void;
}){ return (
  <div className="flex flex-wrap gap-2">
    <button className="vog-btn-pri" onClick={onUse}>Statement übernehmen</button>
    <button className="vog-btn" onClick={onAlternatives}>Alternativen</button>
    <button className="vog-btn" onClick={onResearch}>Recherche</button>
    <button className="vog-btn" onClick={onFactcheck}>Faktencheck</button>
  </div>
);}
TS

cat > "$ANZ/AnalyzeResultCard.tsx" <<'TS'
"use client";
import React from "react";
import CTAButtons from "./CTAButtons";
export type Claim = { text:string; categoryMain?:string|null; categorySubs?:string[]|null; region?:string|null; authority?:string|null };
export default function AnalyzeResultCard({ claim, onUse }:{ claim: Claim; onUse:(t:string)=>void; }){
  const subs=(claim.categorySubs||[]).join(", ");
  return (
    <div className="vog-card p-4 space-y-3">
      <div className="font-medium">{claim.text}</div>
      <div className="text-sm text-slate-600">
        {claim.categoryMain ? <>Thema: <b>{claim.categoryMain}</b>{subs?<> · Sub: {subs}</>:null}</> : "—"}
        {claim.region ? <> · Region: {claim.region}</> : null}
      </div>
      <CTAButtons
        onUse={()=>onUse(claim.text)}
        onAlternatives={()=>window.dispatchEvent(new CustomEvent("vog:alt",{detail:claim}))}
        onResearch={()=>window.dispatchEvent(new CustomEvent("vog:research",{detail:claim}))}
        onFactcheck={()=>window.dispatchEvent(new CustomEvent("vog:factcheck",{detail:claim}))}
      />
    </div>
  );
}
TS

cat > "$ANZ/NewsFeedPanel.tsx" <<'TS'
"use client";
import React from "react";
type Item = { title:string; url:string; score?:number; source?:string };
export default function NewsFeedPanel({ topic, region, keywords=[] as string[] }:{
  topic:string; region?:string|null; keywords?:string[];
}){
  const [items,setItems]=React.useState<Item[]|null>(null);
  const [errors,setErrors]=React.useState<string[]|null>(null);
  const [loading,setLoading]=React.useState(false);
  async function load(){
    setLoading(true); setErrors(null);
    try{
      const res=await fetch("/api/search/civic",{method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({topic,region:region||undefined,keywords,limit:8})});
      const js=await res.json(); setItems(Array.isArray(js.items)?js.items:[]);
      if(js.errors) setErrors(js.errors);
    }catch(e:any){ setItems([]); setErrors([String(e?.message||e)]) } finally{ setLoading(false) }
  }
  React.useEffect(()=>{ load() },[topic,region,JSON.stringify(keywords)]);
  return (
    <div className="vog-card p-4">
      <div className="font-semibold mb-2">Aktuelle Recherche</div>
      {loading && !items && <div className="vog-skeleton h-4 w-40" />}
      {(!items || items.length===0) ? (
        <div className="text-sm text-slate-600">
          Keine Treffer aus konfigurierten Quellen.
          {errors?.length ? <details className="text-xs mt-2"><summary>Details</summary>
            <ul className="list-disc ml-4">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></details> : null}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it,i)=>(
            <li key={i}>
              <a href={it.url} target="_blank" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <div className="font-medium tw-fallback-line-clamp-2">{it.title}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {(it.source ?? (()=>{try{return new URL(it.url).host}catch{return ""}})())}
                  {typeof it.score==="number" ? ` · Score ${it.score.toFixed(2)}` : ""}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
TS

cat > "$ANZ/ClarifyPanel.tsx" <<'TS'
"use client";
import React from "react";
export default function ClarifyPanel({ questions }:{questions:string[]|undefined}){
  if(!questions?.length) return null;
  return (
    <div className="vog-card-muted p-4">
      <div className="font-semibold mb-2">Klärungsfragen</div>
      <ul className="list-disc ml-5 text-sm space-y-1">{questions.map((q,i)=><li key={i}>{q}</li>)}</ul>
    </div>
  );
}
TS

echo "→ Claim-Match & Dialoge…"
cat > "$ANZ/ClaimMatchBadge.tsx" <<'TS'
"use client";
import React from "react";
import type { ClaimMatch } from "@/lib/claimMatch";
export default function ClaimMatchBadge({ match }:{ match: ClaimMatch }){
  if(match.kind==="verified"){
    const s=match.stmt;
    return <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
      <span className="vog-chip" style={{background:"#ECFDF5",borderColor:"#A7F3D0",color:"#065F46"}}>✓ Verifiziert</span>
      <span className="opacity-80">Trust {s.trust.toFixed(2)} · v{s.version} · Quellen {s.evidenceCount}</span>
    </div>;
  }
  if(match.kind==="cluster"){
    const b=match.top[0];
    return <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
      <span className="vog-chip" style={{background:"#FFFBEB",borderColor:"#FDE68A",color:"#92400E"}}>~ Cluster</span>
      <span className="opacity-80">Top {b?.title ?? "Variante"} · Trust {(b?.trust??0).toFixed(2)} · Quellen {b?.evidenceCount ?? 0}</span>
    </div>;
  }
  return <div className="text-xs text-slate-500"><span className="vog-chip">∅ Neu</span></div>;
}
TS

cat > "$ANZ/QualifyDialog.tsx" <<'TS'
"use client";
import React from "react";
import { FLAGS } from "@/config/flags";
export default function QualifyDialog({ open, onClose, clusterId }:{ open:boolean; onClose:()=>void; clusterId?:string; }){
  const [loading,setLoading]=React.useState(false); const [msg,setMsg]=React.useState<string|null>(null);
  async function start(tier:"mini"|"std"|"pro"){
    setLoading(true); setMsg(null);
    try{
      const r=await fetch("/api/qualify/start",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({clusterId,tier})});
      const j=await r.json(); setMsg(`Job gestartet (#${j?.jobId||"—"}) – Escrow: ${j?.escrow?.coins ?? "?"} Coins`);
    } finally { setLoading(false); }
  }
  if(!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
    <div className="vog-card p-4 max-w-md w-full">
      <div className="font-semibold mb-2">Qualifizieren (Coins)</div>
      {!FLAGS.ENABLE_COINS ? <div className="text-sm text-slate-600">Coin-System deaktiviert.</div> :
        <div className="space-y-2">
          <button className="vog-btn w-full" disabled={loading} onClick={()=>start("mini")}>Mini (3 Coins) – Kategorien + 2 Quellen</button>
          <button className="vog-btn w-full" disabled={loading} onClick={()=>start("std")}>Standard (7 Coins) – + Region + Summary</button>
          <button className="vog-btn w-full" disabled={loading} onClick={()=>start("pro")}>Pro (15 Coins) – + Faktencheck (3 Reviewer) + Merge-Vorschlag</button>
        </div>}
      {msg && <div className="mt-3 text-sm" style="color:#065F46;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:.75rem;padding:.5rem .75rem">{msg}</div>}
      <div className="mt-3 flex justify-end"><button className="vog-btn-ghost" onClick={onClose}>Schließen</button></div>
    </div>
  </div>;
}
TS

cat > "$ANZ/AutopilotDialog.tsx" <<'TS'
"use client";
import React from "react";
import { FLAGS } from "@/config/flags";
export default function AutopilotDialog({ open, onClose, text }:{ open:boolean; onClose:()=>void; text:string }){
  const [loading,setLoading]=React.useState(false); const [msg,setMsg]=React.useState<string|null>(null);
  async function start(){
    setLoading(true); setMsg(null);
    try{
      const r=await fetch("/api/autopilot/start",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text})});
      const j=await r.json(); setMsg(`Autopilot gestartet (#${j?.jobId||"—"}) – wir benachrichtigen dich.`);
    } finally { setLoading(false); }
  }
  if(!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
    <div className="vog-card p-4 max-w-md w-full">
      <div className="font-semibold mb-2">eDebatte übernimmt</div>
      {!FLAGS.ENABLE_AUTOPILOT ? <div className="text-sm text-slate-600">Autopilot deaktiviert.</div> :
        <div className="space-y-3 text-sm text-slate-700">
          <p>Wir erstellen ein sauberes Statement, sammeln Belege und stoßen ggf. den Faktencheck an.</p>
          <button className="vog-btn-pri w-full" onClick={start} disabled={loading}>Autopilot starten</button>
          {msg && <div className="text-sm" style="color:#065F46;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:.75rem;padding:.5rem .75rem">{msg}</div>}
        </div>}
      <div className="mt-3 flex justify-end"><button className="vog-btn-ghost" onClick={onClose}>Schließen</button></div>
    </div>
  </div>;
}
TS

cat > "$ANZ/SmartClaimCard.tsx" <<'TS'
"use client";
import React from "react";
import AnalyzeResultCard, { type Claim } from "./AnalyzeResultCard";
import { getClaimMatch, type ClaimMatch } from "@/lib/claimMatch";
import ClaimMatchBadge from "./ClaimMatchBadge";
import QualifyDialog from "./QualifyDialog";

export default function SmartClaimCard({ claim, onUse }:{ claim: Claim; onUse:(t:string)=>void; }){
  const [match,setMatch]=React.useState<ClaimMatch>({kind:"none"});
  const [openQualify,setOpenQualify]=React.useState(false);
  React.useEffect(()=>{ let ok=true; getClaimMatch(claim.text).then(m=>{ if(ok) setMatch(m) }); return ()=>{ok=false} },[claim.text]);
  const primary = match.kind==="verified" ? ()=>window.location.assign(`/statements/${match.stmt.id}`) : ()=>onUse(claim.text);
  return (
    <div className="space-y-2">
      <ClaimMatchBadge match={match}/>
      <AnalyzeResultCard claim={claim} onUse={primary}/>
      {match.kind==="cluster" && (
        <div className="flex flex-wrap gap-2">
          <button className="vog-btn" onClick={()=>setOpenQualify(true)}>Qualifizieren (Coins)</button>
          <a className="vog-btn" href={`/clusters/${match.clusterId}`}>Merge ansehen</a>
        </div>
      )}
      {match.kind==="verified" && (
        <div className="flex flex-wrap gap-2">
          <a className="vog-btn" href={`/statements/${match.stmt.id}#discuss`}>Diskutieren</a>
          <a className="vog-btn" href={`/statements/${match.stmt.id}?join=1`}>Beitreten</a>
        </div>
      )}
      <QualifyDialog open={openQualify} onClose={()=>setOpenQualify(false)} clusterId={match.kind==="cluster" ? match.clusterId : undefined}/>
    </div>
  );
}
TS

echo "→ Neue Widgets: StanceSpectrum + NarrativeBreaker + ObjectionCollector + CounterSynth…"
cat > "$ANZ/StanceSpectrum.tsx" <<'TS'
"use client";
import React from "react";
type Stance = '<<'|'<'|'~'|'>'|'>>';
type Variant = { stance:Stance; thesis:string; proposals:string[]; tradeoffs:string[]; evidence:{title:string;url:string;kind:'press'|'official'|'study'}[]; status:'new'|'fragment'|'verified'; trust?:number; };
export type StanceBundle = { coverageScore:number; symmetry:number; variants:Variant[]; missing:Stance[] };

export default function StanceSpectrum({ claimText }:{ claimText:string }){
  const [data,setData]=React.useState<StanceBundle|null>(null);
  const [active,setActive]=React.useState<Stance>('~' as Stance);
  React.useEffect(()=>{ (async ()=>{
    const r=await fetch("/api/stance/expand",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:claimText})});
    const j=await r.json(); setData(j);
  })(); },[claimText]);

  if(!data) return <div className="vog-card p-4"><div className="vog-skeleton h-4 w-40 mb-2"></div><div className="vog-skeleton h-24 w-full"></div></div>;
  const order:['<<','<','~','>','>>']=['<<','<','~','>','>>'];
  const vMap=Object.fromEntries(data.variants.map(v=>[v.stance,v]));
  return (
    <div className="vog-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Lager-Spektrum</div>
        <div className="text-xs text-slate-600">Coverage: {Math.round(data.coverageScore*5)}/5 · Balance: {data.symmetry.toFixed(2)}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {order.map(s=>(
          <button key={s} onClick={()=>setActive(s)} className="vog-chip" style={active===s?{borderColor:"#0EA5E9",color:"#0EA5E9"}:{}}>{s}</button>
        ))}
      </div>
      <div className="text-sm text-slate-700">
        {vMap[active] ? (
          <div className="space-y-2">
            <div><b>These:</b> {vMap[active].thesis}</div>
            <div><b>Maßnahmen:</b> {vMap[active].proposals.join(" · ")||"—"}</div>
            <div><b>Trade-offs:</b> {vMap[active].tradeoffs.join(" · ")||"—"}</div>
            <div className="text-xs"><b>Quellen:</b> {(vMap[active].evidence||[]).map((e,i)=><a key={i} href={e.url} target="_blank" className="underline mr-2">{e.title}</a>)}</div>
          </div>
        ) : <div className="text-sm">Noch keine Variante – <span className="underline">Qualifizieren</span> sinnvoll.</div>}
      </div>
    </div>
  );
}
TS

cat > "$ANZ/NarrativeBreaker.tsx" <<'TS'
"use client";
import React from "react";
export default function NarrativeBreaker({ text }:{ text:string }){
  // Demo: heuristisch ein paar „Myth→Fact“
  const myth = text;
  const facts = ["Relevante Datenlage ist uneinheitlich", "Es gibt Gegenbeispiele in Region X"];
  const fallacies = ["cherry_picking","false_dilemma"];
  const tradeoffs = ["Kosten steigen kurzfristig","Koordinationsaufwand"];
  return (
    <div className="vog-card p-4 space-y-2">
      <div className="font-semibold">NarrativeBreaker</div>
      <div className="text-sm"><b>Mythos:</b> {myth}</div>
      <div className="text-sm"><b>Fakten:</b> {facts.join(" · ")}</div>
      <div className="text-sm"><b>Typische Muster:</b> {fallacies.join(", ")}</div>
      <div className="text-sm"><b>Trade-offs:</b> {tradeoffs.join(" · ")}</div>
    </div>
  );
}
TS

cat > "$ANZ/ObjectionCollector.tsx" <<'TS'
"use client";
import React from "react";
type O = { id:string; text:string; polarity:'pro'|'con'|'neutral' };
export default function ObjectionCollector(){
  const [list,setList]=React.useState<O[]>([]);
  const [text,setText]=React.useState(""); const [pol,setPol]=React.useState<O["polarity"]>("con");
  function add(){ if(!text.trim())return; setList([{id:Math.random().toString(36).slice(2), text, polarity:pol}, ...list]); setText(""); }
  const groups={pro:list.filter(x=>x.polarity==='pro'),con:list.filter(x=>x.polarity==='con'),neutral:list.filter(x=>x.polarity==='neutral')};
  const coverage = [groups.pro.length>0,groups.con.length>0,groups.neutral.length>0].filter(Boolean).length;
  return (
    <div className="vog-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Einwände & Argumente</div>
        <div className="text-xs text-slate-600">Coverage: {coverage}/3</div>
      </div>
      <div className="flex gap-2">
        <select className="border rounded-xl px-2 py-1 text-sm" value={pol} onChange={e=>setPol(e.target.value as any)}>
          <option value="con">Contra</option><option value="pro">Pro</option><option value="neutral">Neutral</option>
        </select>
        <input className="flex-1 border rounded-xl px-2 py-1 text-sm" placeholder="Einwand/Argument…" value={text} onChange={e=>setText(e.target.value)} />
        <button className="vog-btn" onClick={add}>Add</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div><div className="font-medium mb-1">Pro</div>{groups.pro.map(o=><div key={o.id} className="border rounded-xl p-2 mb-1">{o.text}</div>)||null}</div>
        <div><div className="font-medium mb-1">Neutral</div>{groups.neutral.map(o=><div key={o.id} className="border rounded-xl p-2 mb-1">{o.text}</div>)||null}</div>
        <div><div className="font-medium mb-1">Contra</div>{groups.con.map(o=><div key={o.id} className="border rounded-xl p-2 mb-1">{o.text}</div>)||null}</div>
      </div>
    </div>
  );
}
TS

cat > "$ANZ/CounterSynth.tsx" <<'TS'
"use client";
import React from "react";
export default function CounterSynth({ text }:{ text:string }){
  // Demo: konstante Werte; Backend kann confidence/dissent berechnen
  const essence="Kurz-Essenz basierend auf gesammelten Einwänden & Fakten.";
  const confidence=0.71; const dissent=[{id:"d1", title:"Datenlage unzureichend", status:"open"},{id:"d2", title:"Religiös motivierte Gegenposition", status:"open"}];
  return (
    <div className="vog-card p-4 space-y-2">
      <div className="font-semibold">Quick-Essenz</div>
      <div className="text-sm">{essence}</div>
      <div className="text-xs text-slate-600">Confidence: {confidence} · Dissent: {dissent.length} offen</div>
      <ul className="text-xs list-disc ml-5">{dissent.map(d=><li key={d.id}>{d.title} – {d.status}</li>)}</ul>
    </div>
  );
}
TS

echo "→ Public-Seite (/contributions/new)…"
cat > "$SRC/app/contributions/new/page.tsx" <<'TS'
"use client";
import React from "react";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import CounterSynth from "@/components/analyze/CounterSynth";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";

export default function ContributionQuick(){
  const [text,setText]=React.useState<string>(typeof window!=="undefined" ? (new URLSearchParams(window.location.search).get("text")||"") : "");
  async function analyzeAndMove(){
    const url="/api/contributions/analyze?mode=multi&clarify=1";
    const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text, maxClaims:4})});
    const j=await r.json(); const claim=(j?.claims?.[0]?.text||text||"").slice(0,500);
    const u=new URL("/statements/new", window.location.origin); if(claim) u.searchParams.set("text", claim); window.location.href=u.toString();
  }
  return (
    <div className="container-vog">
      <h1 className="vog-head mb-4">Beitrag erstellen &amp; analysieren</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="vog-card p-4 space-y-3">
            <textarea className="w-full min-h-[200px] rounded-2xl border p-3" placeholder="Schreibe deinen Beitrag/These…" value={text} onChange={e=>setText(e.target.value)}/>
            <div className="flex gap-2">
              <button className="vog-btn-pri" onClick={analyzeAndMove} disabled={!text}>Analyse starten</button>
              <div className="vog-chip">Schnell-Flow</div>
            </div>
          </div>
          {text && (
            <>
              <StanceSpectrum claimText={text}/>
              <ObjectionCollector/>
              <CounterSynth text={text}/>
            </>
          )}
        </div>
        <div className="space-y-3">
          <NewsFeedPanel topic={"Allgemein"} region={null} keywords={text? [text] : []}/>
          <div className="vog-card p-4 text-sm">
            <div className="font-semibold mb-1">Hinweis</div>
            Du kannst jederzeit abbrechen – <b>eDebatte</b> übernimmt auf Wunsch Redaktion &amp; Belege.
          </div>
        </div>
      </div>
    </div>
  );
}
TS

echo "→ Pro-Seite (/contributions/analyze)…"
cat > "$SRC/app/contributions/analyze/page.tsx" <<'TS'
"use client";
import React from "react";
import SmartClaimCard from "@/components/analyze/SmartClaimCard";
import ClarifyPanel from "@/components/analyze/ClarifyPanel";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import CounterSynth from "@/components/analyze/CounterSynth";
import AutopilotDialog from "@/components/analyze/AutopilotDialog";

type Claim={ text:string; categoryMain?:string|null; categorySubs?:string[]|null; region?:string|null; authority?:string|null };
type Res={ language?:string; mainTopic?:string|null; subTopics?:string[]; regionHint?:string|null; claims?:Claim[]; followUps?:string[]; _meta?:{picked?:string|null} };

export default function AnalyzePage(){
  const [text,setText]=React.useState("");
  const [busy,setBusy]=React.useState(false);
  const [res,setRes]=React.useState<Res|null>(null);
  const [openAuto,setOpenAuto]=React.useState(false);

  async function analyze(clarify:boolean){
    setBusy(true);
    const url="/api/contributions/analyze?mode=multi"+(clarify?"&clarify=1":"");
    const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text, maxClaims:6})});
    const j=await r.json(); setRes(j); setBusy(false);
  }
  function useStatement(s:string){ const u=new URL("/statements/new", window.location.origin); u.searchParams.set("text", s); window.location.href=u.toString(); }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-2">Beitrag erstellen &amp; analysieren (Pro)</h1>
      <div className="text-sm text-slate-600 mb-4">Für Redaktion/Partner. Öffentlich besser: <a className="underline" href="/contributions/new">„Beitrag (schnell)“</a>.</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="vog-card p-4">
            <div className="vog-stepper mb-2"><span className="dot active"></span>Eingabe → <span className="dot"></span>Analyse → <span className="dot"></span>Auswahl → <span className="dot"></span>Feinschliff → <span className="dot"></span>Veröffentlichen</div>
            <textarea className="w-full min-h-[180px] rounded-2xl border p-3" placeholder="Worum geht es?" value={text} onChange={e=>setText(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button className="vog-btn-pri" onClick={()=>analyze(false)} disabled={!text||busy}>Analyse starten</button>
              <button className="vog-btn" onClick={()=>analyze(true)} disabled={!text||busy}>Analyse + Klärungsfragen</button>
              <button className="vog-btn-ghost ml-auto" onClick={()=>setOpenAuto(true)}>Abbrechen – eDebatte übernimmt</button>
            </div>
          </div>

          {res && (
            <div className="space-y-3">
              <div className="vog-card p-4">
                <div className="font-semibold">Ergebnis • Sprache: {res.language ?? "—"} • Hauptthema: {res.mainTopic ?? "—"} {res._meta?.picked?<>• Pipeline: {res._meta?.picked}</>:null}</div>
              </div>
              {(res.claims||[]).map((c,i)=>(
                <div key={i} className="space-y-2">
                  <div className="text-xs text-slate-500">Aussage {i+1}</div>
                  <SmartClaimCard claim={c} onUse={useStatement}/>
                </div>
              ))}
              <ClarifyPanel questions={res.followUps}/>
              {text && <>
                <StanceSpectrum claimText={text}/>
                <ObjectionCollector/>
                <CounterSynth text={text}/>
              </>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <NewsFeedPanel topic={res?.mainTopic||"Allgemein"} region={res?.regionHint||null} keywords={res?.subTopics||[]} />
          <div className="vog-card p-4">
            <div className="font-semibold mb-2">Nächste Schritte</div>
            <ol className="list-decimal ml-5 text-sm space-y-1">
              <li>Claim wählen (verifiziert/cluster/neu)</li>
              <li>Fehlende Lager im Spektrum füllen (Coins)</li>
              <li>Faktencheck/Belege ergänzen</li>
              <li>Veröffentlichen</li>
            </ol>
          </div>
        </div>
      </div>
      <AutopilotDialog open={openAuto} onClose={()=>setOpenAuto(false)} text={text}/>
    </div>
  );
}
TS

echo "→ Demo/Pitch-Seite…"
cat > "$SRC/app/demo/pitch/page.tsx" <<'TS'
"use client";
import React from "react";
import SmartClaimCard from "@/components/analyze/SmartClaimCard";
import ClarifyPanel from "@/components/analyze/ClarifyPanel";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import CounterSynth from "@/components/analyze/CounterSynth";
import AutopilotDialog from "@/components/analyze/AutopilotDialog";

type Claim={ text:string; categoryMain?:string|null; categorySubs?:string[]|null; region?:string|null; authority?:string|null };
type Res={ language?:string; mainTopic?:string|null; subTopics?:string[]; regionHint?:string|null; claims?:Claim[]; followUps?:string[]; _meta?:{picked?:string|null} };

export default function PitchPage(){
  const [text,setText]=React.useState("Kostenloser Nahverkehr in Berlin und bessere Straßenbahn-Anbindung.");
  const [res,setRes]=React.useState<Res|null>(null);
  const [busy,setBusy]=React.useState(false);
  const [openAuto,setOpenAuto]=React.useState(false);
  async function analyze(clarify:boolean){
    setBusy(true);
    const r=await fetch(`/api/contributions/analyze?mode=multi${clarify?"&clarify=1":""}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text, maxClaims:6})});
    const j=await r.json(); setRes(j); setBusy(false);
  }
  function useStatement(s:string){ const u=new URL("/statements/new", window.location.origin); u.searchParams.set("text", s); window.location.assign(u) }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-2">Pitch-Modus: eDebatte Journey</h1>
      <div className="text-sm text-slate-600 mb-4">Geführter Flow (Demo) – Narrative-Breaker, Einwände, Stances, Coins & Autopilot</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="vog-card p-4">
            <div className="vog-stepper mb-2"><span className="dot active"></span>Eingabe → <span className="dot"></span>Analyse → <span className="dot"></span>Auswahl → <span className="dot"></span>Feinschliff → <span className="dot"></span>Veröffentlichen</div>
            <textarea className="w-full min-h-[160px] rounded-2xl border p-3" value={text} onChange={e=>setText(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button className="vog-btn-pri" onClick={()=>analyze(false)} disabled={busy||!text}>Analyse starten</button>
              <button className="vog-btn" onClick={()=>analyze(true)} disabled={busy||!text}>+ Klärungsfragen</button>
              <button className="vog-btn-ghost ml-auto" onClick={()=>setOpenAuto(true)}>Abbrechen – eDebatte übernimmt</button>
            </div>
          </div>
          {res && (
            <div className="space-y-3">
              <div className="vog-card p-4"><div className="font-semibold">Ergebnis • Sprache: {res.language ?? "—"} • Hauptthema: {res.mainTopic ?? "—"} {res._meta?.picked?<>• Pipeline: {res._meta?.picked}</> : null}</div></div>
              {(res.claims||[]).map((c,i)=>(
                <div key={i} className="space-y-2">
                  <div className="text-xs text-slate-500">Aussage {i+1}</div>
                  <SmartClaimCard claim={c} onUse={useStatement}/>
                </div>
              ))}
              <ClarifyPanel questions={res.followUps}/>
              <StanceSpectrum claimText={text}/>
              <ObjectionCollector/>
              <CounterSynth text={text}/>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <NewsFeedPanel topic={res?.mainTopic||"ÖPNV"} region={res?.regionHint||"DE:BE"} keywords={res?.subTopics||[]} />
          <div className="vog-card p-4 text-sm">
            <div className="font-semibold mb-1">Nächste Schritte</div>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Claim wählen (verifiziert/cluster/neu)</li>
              <li>Fehlende Lager im Spektrum füllen (Coins)</li>
              <li>Faktencheck &amp; Belege ergänzen</li>
              <li>Veröffentlichen</li>
            </ol>
          </div>
        </div>
      </div>
      <AutopilotDialog open={openAuto} onClose={()=>setOpenAuto(false)} text={text}/>
    </div>
  );
}
TS

echo "→ API-Stubs: Similar / Qualify / Autopilot / Stance-Expand…"
cat > "$API/statements/similar/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest){
  const text = String(req.nextUrl.searchParams.get("text")||"").toLowerCase();
  if(/tourist|touristen|abzocke/.test(text)){
    return NextResponse.json({ kind:"verified", stmt:{ id:"stmt-verified-001", title:"Faire Preise in Tourismuslagen der EU", trust:0.92, version:3, evidenceCount:7, sim:0.91 }});
  }
  if(/öpnv|tram|straßenbahn|nahverkehr|bvg|köpenick/.test(text)){
    return NextResponse.json({ kind:"cluster", clusterId:"clu-berlin-tram", top:[
      { id:"stmt-berlin-tram-a", title:"Straßenbahn Ostkreuz–Köpenick ausbauen", trust:0.62, evidenceCount:2, sim:0.82 },
      { id:"stmt-berlin-tram-b", title:"Kostenloser ÖPNV in Berlin", trust:0.55, evidenceCount:1, sim:0.78 }
    ]});
  }
  return NextResponse.json({ kind:"none" });
}
TS

cat > "$API/qualify/start/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  const tier = String(body?.tier||"std");
  const coins = tier==="mini" ? 3 : tier==="pro" ? 15 : 7;
  const jobId = `QJ-${Date.now().toString(36)}`;
  return NextResponse.json({ ok:true, jobId, escrow:{ coins } });
}
TS

cat > "$API/autopilot/start/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(){
  const jobId = `AP-${Date.now().toString(36)}`;
  return NextResponse.json({ ok:true, jobId });
}
TS

cat > "$API/stance/expand/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime="nodejs"; export const dynamic="force-dynamic";
type Stance='<<'|'<'|'~'|'>'|'>>';
export async function POST(req: NextRequest){
  const _ = await req.json().catch(()=>({text:""}));
  // Demo: generische, aber plausible Stance-Varianten
  const v = (s:Stance, thesis:string, verified=false)=>({
    stance:s, thesis, proposals:["Maßnahme A","Maßnahme B"], tradeoffs:["Kosten","Zielkonflikt"],
    evidence:[{title:"Pressebericht",url:"#",kind:"press"},{title:"Offizielles Dokument",url:"#",kind:"official"}],
    status: verified? "verified" : "fragment", trust: verified? 0.88 : 0.58
  });
  const variants = [
    v('<<',"Maximaler Eingriff / radikale Änderung", false),
    v('<',"Moderate Reform / gezielte Steuerung", true),
    v('~',"Kompromiss-Variante / abgestuft", true),
    v('>',"Moderates Bewahren / marktnahe Lösung", false),
    v('>>',"Konservativ / keine Änderung, Alternativen prüfen", false),
  ];
  const coverage = variants.filter(x=>!!x).length/5;
  const symmetry = 0.72;
  return NextResponse.json({ coverageScore: coverage, symmetry, variants, missing: [] });
}
TS

echo "→ Cleanup Cache…"
rm -rf "$APP_WEB/.next" 2>/dev/null || true
echo "✓ Fertig. Starte: pnpm --filter @vog/web dev"
