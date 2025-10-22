#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

# 1) NewsFeedPanel
mkdir -p "$ROOT/apps/web/src/components/analyze"
cat > "$ROOT/apps/web/src/components/analyze/NewsFeedPanel.tsx" <<'TS'
"use client";
import React from "react";

type Item = { title:string; url:string; score?:number; source?:string };
export default function NewsFeedPanel({ topic, region, keywords=[] as string[] }:{
  topic: string; region?: string; keywords?: string[];
}){
  const [items,setItems] = React.useState<Item[]|null>(null);
  const [errors,setErrors] = React.useState<string[]|null>(null);
  const [loading,setLoading] = React.useState(false);

  async function load(){
    setLoading(true);
    setErrors(null);
    try{
      const res = await fetch("/api/search/civic", {
        method:"POST", headers:{ "content-type":"application/json" },
        body: JSON.stringify({ topic, region, keywords, limit: 8 })
      });
      const js = await res.json();
      setItems(Array.isArray(js.items)?js.items:[]);
      if(js.errors) setErrors(js.errors);
    }catch(e:any){
      setErrors([String(e?.message||e)]);
      setItems([]);
    }finally{ setLoading(false); }
  }

  React.useEffect(()=>{ load(); /* on mount/topic change */ }, [topic, region, JSON.stringify(keywords)]);

  if(loading && !items) return <div className="text-sm opacity-70">Lade News …</div>;
  if(!items || items.length===0){
    return (
      <div className="rounded-2xl border p-4">
        <div className="font-semibold mb-1">Aktuelle Recherche</div>
        <div className="text-sm opacity-70 mb-2">Keine Treffer aus konfigurierten Quellen.</div>
        {errors?.length ? (
          <details className="text-xs opacity-70">
            <summary>Details/Fehler</summary>
            <ul className="list-disc ml-4 mt-1">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul>
          </details>
        ) : null}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border p-4">
      <div className="font-semibold mb-3">Aktuelle Recherche</div>
      <ul className="space-y-2">
        {items.map((it, i)=>(
          <li key={i} className="group">
            <a href={it.url} target="_blank" className="block rounded-xl border p-3 hover:bg-muted">
              <div className="font-medium">{it.title}</div>
              <div className="text-xs opacity-70 mt-1">
                {it.source ?? new URL(it.url).host} {typeof it.score==="number" ? `· Score ${it.score.toFixed(2)}` : ""}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
TS

# 2) CTA Buttons + Result Card
cat > "$ROOT/apps/web/src/components/analyze/CTAButtons.tsx" <<'TS'
"use client";
import React from "react";
import { Button } from "@vog/ui";

export default function CTAButtons({ onUse, onAlternatives, onResearch, onFactcheck }:{
  onUse: ()=>void; onAlternatives: ()=>void; onResearch: ()=>void; onFactcheck: ()=>void;
}){
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onUse}>Statement übernehmen</Button>
      <Button variant="secondary" onClick={onAlternatives}>Alternativen</Button>
      <Button variant="secondary" onClick={onResearch}>Recherche</Button>
      <Button variant="secondary" onClick={onFactcheck}>Faktencheck</Button>
    </div>
  );
}
TS

cat > "$ROOT/apps/web/src/components/analyze/AnalyzeResultCard.tsx" <<'TS'
"use client";
import React from "react";
import CTAButtons from "./CTAButtons";

export default function AnalyzeResultCard({ claim, onUse }:{
  claim: { text:string; categoryMain?:string|null; categorySubs?:string[]; region?:string|null; authority?:string|null };
  onUse:(text:string)=>void;
}){
  const subs = (claim.categorySubs||[]).join(", ");
  return (
    <div className="rounded-2xl border p-4 space-y-2">
      <div className="font-medium">{claim.text}</div>
      <div className="text-sm opacity-70">
        {claim.categoryMain ? <>Thema: <b>{claim.categoryMain}</b>{subs?<> · Sub: {subs}</>:null}</> : "—"}
        {claim.region ? <> · Region: {claim.region}</> : null}
      </div>
      <CTAButtons
        onUse={()=>onUse(claim.text)}
        onAlternatives={()=>window.dispatchEvent(new CustomEvent("vog:alt", { detail: claim }))}
        onResearch={()=>window.dispatchEvent(new CustomEvent("vog:research", { detail: claim }))}
        onFactcheck={()=>window.dispatchEvent(new CustomEvent("vog:factcheck", { detail: claim }))}
      />
    </div>
  );
}
TS

# 3) Neue Analyze-Page (UX V2)
cat > "$ROOT/apps/web/src/app/contributions/analyze/page.tsx" <<'TS'
"use client";
import React from "react";
import AnalyzeResultCard from "@/components/analyze/AnalyzeResultCard";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";
import { Button } from "@vog/ui";

type Res = {
  language?: string; mainTopic?: string|null; subTopics?: string[];
  regionHint?: string|null;
  claims?: { text:string; categoryMain?:string|null; categorySubs?:string[]; region?:string|null; authority?:string|null }[];
  followUps?: string[]; // optional: comes from clarify
  news?: any[];
  scoreHints?: { baseWeight?: number; reasons?: string[] };
  _meta?: { picked?: string|null };
};

export default function AnalyzePage(){
  const [text,setText] = React.useState("");
  const [busy,setBusy] = React.useState(false);
  const [res,setRes] = React.useState<Res|null>(null);
  const [debug,setDebug] = React.useState<any>(null);

  async function analyze(opts:{clarify?:boolean} = {}){
    setBusy(true);
    try{
      const url = "/api/contributions/analyze?mode=multi" + (opts.clarify ? "&clarify=1" : "");
      const r = await fetch(url, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ text, maxClaims: 6 }) });
      const j = await r.json();
      setRes(j);
      setDebug(j);
    } finally { setBusy(false); }
  }

  function useStatement(s:string){
    // Weiterleitung in den Statement-Editor (leichter, bis der Editor steht).
    const u = new URL("/statements/new", window.location.origin);
    u.searchParams.set("text", s);
    window.location.href = u.toString();
  }

  const headGrad = "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className={`text-3xl font-extrabold tracking-tight mb-3 ${headGrad}`}>Beitrag erstellen & analysieren</h1>
      <p className="text-sm opacity-80 mb-6">Schreibe dein Anliegen, starte die KI-Analyse, wähle eine Aussage und veröffentliche sie oder vertiefe mit Alternativen, Recherche und Faktencheck.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eingabe + Aktionen */}
        <div className="lg:col-span-2 space-y-3">
          <textarea
            className="w-full min-h-[180px] rounded-2xl border p-4"
            placeholder="Worum geht es? Was soll sich ändern? (z. B. Kostenloser Nahverkehr, bessere Straßenbahn-Anbindung …)"
            value={text} onChange={e=>setText(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={()=>analyze()} disabled={!text || busy}>Analyse starten</Button>
            <Button variant="secondary" onClick={()=>analyze({clarify:true})} disabled={!text || busy}>Analyse + Klärungsfragen</Button>
          </div>

          {/* Ergebnisse */}
          {res && (
            <div className="space-y-3">
              <div className="rounded-2xl border p-4">
                <div className="font-semibold">
                  Ergebnisse • Sprache: {res.language ?? "—"} • Hauptthema: {res.mainTopic ?? "—"}
                  {res._meta?.picked ? <> • Pipeline: {res._meta?.picked}</> : null}
                </div>
              </div>

              <div className="space-y-3">
                {(res.claims||[]).map((c,i)=>(
                  <div key={i} className="space-y-2">
                    <div className="text-sm opacity-70">Aussage {i+1}</div>
                    <AnalyzeResultCard claim={c} onUse={useStatement}/>
                  </div>
                ))}
                {(res.claims?.length??0)===0 && (
                  <div className="rounded-2xl border p-4">Keine Aussagen erkannt. Probiere <b>Analyse + Klärungsfragen</b>.</div>
                )}
              </div>

              {/* Followups */}
              {(res.followUps?.length ?? 0) > 0 && (
                <div className="rounded-2xl border p-4">
                  <div className="font-semibold mb-2">Klärungsfragen (optional):</div>
                  <ul className="list-disc ml-5 space-y-1">{res.followUps!.map((q,i)=><li key={i}>{q}</li>)}</ul>
                </div>
              )}

              {/* Debug/Meta */}
              <details className="rounded-2xl border p-4">
                <summary className="cursor-pointer font-medium">Debug / Meta</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>

        {/* Rechte Spalte: News / Orientierung */}
        <div className="space-y-3">
          <NewsFeedPanel
            topic={res?.mainTopic || "ÖPNV"}
            region={res?.regionHint || "DE:BE"}
            keywords={res?.subTopics || []}
          />
          <div className="rounded-2xl border p-4">
            <div className="font-semibold mb-2">Was ist der nächste Schritt?</div>
            <ol className="list-decimal ml-5 space-y-1 text-sm">
              <li>Aussage auswählen → <i>„Statement übernehmen“</i></li>
              <li>Optional Alternativen vergleichen</li>
              <li>Recherche öffnen & Belege sammeln</li>
              <li>Faktencheck anstoßen oder veröffentlichen</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
TS

# 4) (Optional) API: Klarheitsfragen durchreichen, wenn &clarify=1
# nutzt bereits vorhandenes features/analyze/clarify.ts (existiert im Repo)
ANALYZE_ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
if [ -f "$ANALYZE_ROUTE" ]; then
  perl -0777 -pe 'BEGIN{undef $/} s/(\)\s*:\s*await analyzeContribution\([^)]+\);)/$1\n\n    if (req.nextUrl.searchParams.get("clarify") === "1") {\n      try {\n        const { clarify } = await import("@\/features\/analyze\/clarify");\n        const qs = await clarify(text);\n        if (Array.isArray(qs) && qs.length) (result as any).followUps = qs.slice(0,5);\n      } catch {}\n    }/s' -i "$ANALYZE_ROUTE"
fi

echo "OK. Starte: pnpm --filter @vog/web dev"
