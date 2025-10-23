#!/usr/bin/env bash
set -euo pipefail

# Root ermitteln (git) oder relativ vom Skript
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

mkdir -p "$ANZ" "$LIB" "$CFG" "$SRC/app/demo/pitch" "$API/statements/similar" "$API/qualify/start" "$API/autopilot/start"

# 1) Feature-Flags (Pitch/Coins/Autopilot)
cat > "$CFG/flags.ts" <<'TS'
export const FLAGS = {
  PITCH_MODE: true,          // Demo-Flow (geführte Seite)
  ENABLE_COINS: true,        // Qualifizieren (Coins)
  ENABLE_AUTOPILOT: true,    // "eDebatte übernimmt"
  MAX_CLAIMS_PUBLIC: 4,
  MAX_CLAIMS_PRO: 6,
};
TS

# 2) Claim-Match Helper (Client)
cat > "$LIB/claimMatch.ts" <<'TS'
export type VerifiedHit = { id:string; title:string; trust:number; version:number; evidenceCount:number; sim:number };
export type ClusterHit = { id:string; title:string; trust:number; evidenceCount:number; sim:number };
export type ClaimMatch =
  | { kind:"verified"; stmt: VerifiedHit }
  | { kind:"cluster"; top: ClusterHit[]; clusterId: string }
  | { kind:"none" };

export async function getClaimMatch(text: string): Promise<ClaimMatch> {
  const r = await fetch("/api/statements/similar?text="+encodeURIComponent(text));
  if (!r.ok) return { kind:"none" };
  return await r.json();
}
TS

# 3) ClaimMatch Badge + Actions (klein, neutral)
cat > "$ANZ/ClaimMatchBadge.tsx" <<'TS'
"use client";
import React from "react";
import type { ClaimMatch } from "@/lib/claimMatch";

export default function ClaimMatchBadge({ match }:{ match: ClaimMatch }){
  if(match.kind==="verified"){
    const s = match.stmt;
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="vog-chip bg-green-50 border-green-200 text-green-700">✓ Verifiziert</span>
        <span className="opacity-80">Trust {s.trust.toFixed(2)} · v{s.version} · Quellen {s.evidenceCount}</span>
      </div>
    );
  }
  if(match.kind==="cluster"){
    const best = match.top[0];
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="vog-chip bg-amber-50 border-amber-200 text-amber-700">~ Cluster</span>
        <span className="opacity-80">Top {best?.title ?? "Variante"} · Trust {(best?.trust??0).toFixed(2)} · Quellen {best?.evidenceCount ?? 0}</span>
      </div>
    );
  }
  return <div className="text-xs text-slate-500"><span className="vog-chip">∅ Neu</span></div>;
}
TS

# 4) Qualify-Dialog (Coins)
cat > "$ANZ/QualifyDialog.tsx" <<'TS'
"use client";
import React from "react";
import { FLAGS } from "@/config/flags";

export default function QualifyDialog({ open, onClose, clusterId }:{
  open:boolean; onClose:()=>void; clusterId?:string;
}){
  const [loading,setLoading] = React.useState(false);
  const [msg,setMsg] = React.useState<string|null>(null);

  async function start(tier:"mini"|"std"|"pro"){
    setLoading(true); setMsg(null);
    try{
      const r = await fetch("/api/qualify/start", {
        method:"POST", headers:{ "content-type":"application/json" },
        body: JSON.stringify({ clusterId, tier })
      });
      const j = await r.json();
      setMsg(`Job gestartet (#${j?.jobId || "—"}) – Escrow: ${j?.escrow?.coins ?? "?"} Coins`);
    } finally { setLoading(false); }
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="vog-card p-4 max-w-md w-full">
        <div className="font-semibold mb-2">Qualifizieren (Coins)</div>
        {!FLAGS.ENABLE_COINS ? <div className="text-sm text-slate-600">Coin-System ist deaktiviert.</div> : (
          <div className="space-y-2">
            <button className="vog-btn w-full" disabled={loading} onClick={()=>start("mini")}>Mini (3 Coins) – Kategorien + 2 Quellen</button>
            <button className="vog-btn w-full" disabled={loading} onClick={()=>start("std")}>Standard (7 Coins) – + Region + Summary</button>
            <button className="vog-btn w-full" disabled={loading} onClick={()=>start("pro")}>Pro (15 Coins) – + Faktencheck (3 Reviewer) + Merge-Vorschlag</button>
          </div>
        )}
        {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-2">{msg}</div>}
        <div className="mt-3 flex justify-end">
          <button className="vog-btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
TS

# 5) Autopilot-Dialog (eDebatte übernimmt)
cat > "$ANZ/AutopilotDialog.tsx" <<'TS'
"use client";
import React from "react";
import { FLAGS } from "@/config/flags";

export default function AutopilotDialog({ open, onClose, text }:{ open:boolean; onClose:()=>void; text:string }){
  const [loading,setLoading] = React.useState(false);
  const [msg,setMsg] = React.useState<string|null>(null);

  async function start(){
    setLoading(true); setMsg(null);
    try{
      const r = await fetch("/api/autopilot/start", {
        method:"POST", headers:{ "content-type":"application/json" },
        body: JSON.stringify({ text })
      });
      const j = await r.json();
      setMsg(`Autopilot gestartet (#${j?.jobId || "—"}) – wir benachrichtigen dich.`);
    } finally { setLoading(false); }
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="vog-card p-4 max-w-md w-full">
        <div className="font-semibold mb-2">eDebatte übernimmt</div>
        {!FLAGS.ENABLE_AUTOPILOT ? (
          <div className="text-sm text-slate-600">Autopilot ist deaktiviert.</div>
        ) : (
          <div className="space-y-3 text-sm text-slate-700">
            <p>Wir erstellen ein sauberes Statement, sammeln Belege und stoßen ggf. den Faktencheck an.</p>
            <button className="vog-btn-pri w-full" onClick={start} disabled={loading}>Autopilot starten</button>
            {msg && <div className="text-green-700 bg-green-50 border border-green-200 rounded-xl p-2">{msg}</div>}
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <button className="vog-btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
TS

# 6) SmartClaimCard (fordert Match an, zeigt Status und CTAs je nach Zustand)
cat > "$ANZ/SmartClaimCard.tsx" <<'TS'
"use client";
import React from "react";
import AnalyzeResultCard, { type Claim } from "@/components/analyze/AnalyzeResultCard";
import { getClaimMatch, type ClaimMatch } from "@/lib/claimMatch";
import ClaimMatchBadge from "./ClaimMatchBadge";
import QualifyDialog from "./QualifyDialog";

export default function SmartClaimCard({ claim, onUse }:{
  claim: Claim; onUse:(text:string)=>void;
}){
  const [match,setMatch] = React.useState<ClaimMatch>({ kind:"none" });
  const [openQualify,setOpenQualify] = React.useState(false);

  React.useEffect(()=>{
    let ok = true;
    getClaimMatch(claim.text).then(m=>{ if(ok) setMatch(m); });
    return ()=>{ ok=false; };
  }, [claim.text]);

  function onAlternatives(){ window.dispatchEvent(new CustomEvent("vog:alt", { detail: claim })); }
  function onResearch(){ window.dispatchEvent(new CustomEvent("vog:research", { detail: claim })); }
  function onFactcheck(){ window.dispatchEvent(new CustomEvent("vog:factcheck", { detail: claim })); }

  // Für verified/cluster andere Primär-CTA anbieten
  const primary = match.kind==="verified"
    ? ()=>window.location.assign(`/statements/${match.stmt.id}`)
    : ()=>onUse(claim.text);

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

# 7) Pro-Seite auf SmartClaimCard umstellen (falls vorhanden)
PRO_PAGE="$SRC/app/contributions/analyze/page.tsx"
if [ -f "$PRO_PAGE" ]; then
  # nur den Import/Verwendung austauschen – defensiv
  if ! grep -q "SmartClaimCard" "$PRO_PAGE"; then
    perl -0777 -pe 's/import AnalyzeResultCard[^;]+;//s/import SmartClaimCard from "\/\/@\/components\/analyze\/SmartClaimCard";/s' -i "$PRO_PAGE" || true
    perl -0777 -pe 's/<AnalyzeResultCard claim=\{c\} onUse=\{useStatement\}\/>/<SmartClaimCard claim={c} onUse={useStatement}\/>/g' -i "$PRO_PAGE" || true
    # Fallback: wenn Import nicht gefunden, prependen wir Safe-Import:
    if ! grep -q 'SmartClaimCard' "$PRO_PAGE"; then
      sed -i '' '1s;^;import SmartClaimCard from "@/components/analyze/SmartClaimCard";\n;' "$PRO_PAGE" 2>/dev/null || true
      gsed -i '1s;^;import SmartClaimCard from "@/components/analyze/SmartClaimCard";\n;' "$PRO_PAGE" 2>/dev/null || true
      perl -0777 -pe 's/<AnalyzeResultCard claim=\{c\} onUse=\{useStatement\}\/>/<SmartClaimCard claim={c} onUse={useStatement}\/>/g' -i "$PRO_PAGE" || true
    fi
  fi
fi

# 8) Demo/Pitch-Seite (führt alles zusammen)
cat > "$SRC/app/demo/pitch/page.tsx" <<'TS'
"use client";
import React from "react";
import { FLAGS } from "@/config/flags";
import SmartClaimCard from "@/components/analyze/SmartClaimCard";
import ClarifyPanel from "@/components/analyze/ClarifyPanel";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";
import AutopilotDialog from "@/components/analyze/AutopilotDialog";

type Claim = { text:string; categoryMain?:string|null; categorySubs?:string[]|null; region?:string|null; authority?:string|null };
type Res = {
  language?: string; mainTopic?: string|null; subTopics?: string[];
  regionHint?: string|null; claims?: Claim[]; followUps?: string[];
  _meta?: { picked?: string|null };
};

export default function PitchPage(){
  const [text,setText] = React.useState("Kostenloser Nahverkehr in Berlin und bessere Straßenbahn-Anbindung.");
  const [res,setRes] = React.useState<Res|null>(null);
  const [busy,setBusy] = React.useState(false);
  const [openAuto,setOpenAuto] = React.useState(false);

  async function analyze(clarify:boolean){
    setBusy(true);
    const r = await fetch(`/api/contributions/analyze?mode=multi${clarify?"&clarify=1":""}`, {
      method:"POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify({ text, maxClaims: FLAGS.MAX_CLAIMS_PRO })
    });
    const j = await r.json();
    setRes(j); setBusy(false);
  }

  function useStatement(t:string){
    const u = new URL("/statements/new", window.location.origin);
    u.searchParams.set("text", t); window.location.assign(u);
  }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-2">Pitch-Modus: eDebatte Journey</h1>
      <div className="text-sm text-slate-600 mb-4">Geführter Flow für Demo & Decks • Alle Features integriert</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="vog-card p-4">
            <div className="vog-stepper mb-2"><span className="dot active"></span>Eingabe → <span className="dot"></span>Analyse → <span className="dot"></span>Auswahl → <span className="dot"></span>Feinschliff → <span className="dot"></span>Veröffentlichen</div>
            <textarea className="w-full min-h-[160px] rounded-2xl border p-3" value={text} onChange={e=>setText(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button className="vog-btn-pri" onClick={()=>analyze(false)} disabled={busy || !text}>Analyse starten</button>
              <button className="vog-btn" onClick={()=>analyze(true)} disabled={busy || !text}>+ Klärungsfragen</button>
              <button className="vog-btn-ghost ml-auto" onClick={()=>setOpenAuto(true)}>Abbrechen – eDebatte übernimmt</button>
            </div>
          </div>

          {res && (
            <div className="space-y-3">
              <div className="vog-card p-4">
                <div className="font-semibold">Ergebnis • Sprache: {res.language ?? "—"} • Hauptthema: {res.mainTopic ?? "—"} {res._meta?.picked?<>• Pipeline: {res._meta?.picked}</> : null}</div>
              </div>
              {(res.claims||[]).map((c,i)=>(
                <div key={i} className="space-y-2">
                  <div className="text-xs text-slate-500">Aussage {i+1}</div>
                  <SmartClaimCard claim={c} onUse={useStatement}/>
                </div>
              ))}
              <ClarifyPanel questions={res.followUps||[]}/>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <NewsFeedPanel
            topic={res?.mainTopic || "ÖPNV"}
            region={res?.regionHint || "DE:BE"}
            keywords={res?.subTopics || []}
          />
          <div className="vog-card p-4">
            <div className="font-semibold mb-1">Nächste Schritte</div>
            <ol className="list-decimal ml-5 text-sm space-y-1">
              <li>Passende ClaimCard wählen</li>
              <li>Verifiziert? → direkt beitreten & diskutieren</li>
              <li>Cluster? → <b>Qualifizieren (Coins)</b> starten</li>
              <li>Neu? → Statement übernehmen & veröffentlichen</li>
            </ol>
          </div>
        </div>
      </div>

      <AutopilotDialog open={openAuto} onClose={()=>setOpenAuto(false)} text={text}/>
    </div>
  );
}
TS

# 9) API-Stubs (Pitch-sicher) – Similar
cat > "$API/statements/similar/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest){
  const text = String(req.nextUrl.searchParams.get("text")||"").toLowerCase();

  // simple demo logic: if ÖPNV/Tram → cluster, if "touristen" → verified, else none
  if(/tourist|touristen|abzocke/.test(text)){
    return NextResponse.json({
      kind: "verified",
      stmt: { id:"stmt-verified-001", title:"Faire Preise in Tourismuslagen der EU", trust:0.92, version:3, evidenceCount:7, sim:0.91 }
    }, { status: 200 });
  }
  if(/öpnv|tram|straßenbahn|nahverkehr|bvg|köpenick/.test(text)){
    return NextResponse.json({
      kind: "cluster",
      clusterId: "clu-berlin-tram",
      top: [
        { id:"stmt-berlin-tram-a", title:"Straßenbahn Ostkreuz–Köpenick ausbauen", trust:0.62, evidenceCount:2, sim:0.82 },
        { id:"stmt-berlin-tram-b", title:"Kostenloser ÖPNV in Berlin", trust:0.55, evidenceCount:1, sim:0.78 }
      ]
    }, { status: 200 });
  }
  return NextResponse.json({ kind:"none" }, { status: 200 });
}
TS

# 10) API-Stubs – Qualify Start
cat > "$API/qualify/start/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  const tier = String(body?.tier||"std");
  const coins = tier==="mini" ? 3 : tier==="pro" ? 15 : 7;
  const jobId = `QJ-${Date.now().toString(36)}`;
  return NextResponse.json({ ok:true, jobId, escrow:{ coins } }, { status: 200 });
}
TS

# 11) API-Stubs – Autopilot Start
cat > "$API/autopilot/start/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const jobId = `AP-${Date.now().toString(36)}`;
  return NextResponse.json({ ok:true, jobId }, { status: 200 });
}
TS

echo "→ Pitch-Pack installiert. Öffne: /demo/pitch"
