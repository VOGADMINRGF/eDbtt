#!/usr/bin/env bash
set -euo pipefail

# -------- helpers ----------
ts() { date +%s; }
write() { # $1 path; stdin->file (with backup)
  local f="$1"
  mkdir -p "$(dirname "$f")"
  if [ -f "$f" ]; then cp "$f" "${f}.bak.$(ts)"; echo "• Backup: $f -> ${f}.bak.$(ts)"; fi
  cat > "$f"
  echo "✓ wrote $f"
}

ROOT="$(pwd)"
WEB="apps/web/src"
[ -d "$WEB" ] || { echo "✗ $WEB nicht gefunden (Repo-Root erwartet)"; exit 1; }

# -------- 1) InPlaceHUD ----------
write "$WEB/ui/InPlaceHUD.tsx" <<'TSX'
// apps/web/src/ui/InPlaceHUD.tsx
"use client";
import React from "react";

export default function InPlaceHUD({
  log, analyzing, label="Analyse läuft …"
}:{ log:string[]; analyzing:boolean; label?:string }){
  if (!log?.length && !analyzing) return null;
  return (
    <div className="mt-3 rounded-xl border p-3 text-sm bg-white/70 backdrop-blur">
      <div className="font-medium">{label}</div>
      {!!log?.length && (
        <ul className="list-disc ml-5 mt-1 space-y-1">
          {log.map((l,i)=><li key={i} className="text-slate-700">{l}</li>)}
        </ul>
      )}
      {analyzing && <div className="h-2 w-28 mt-2 rounded bg-slate-200 animate-pulse" />}
    </div>
  );
}
TSX

# -------- 2) ClaimPanelsGate ----------
write "$WEB/ui/ClaimPanelsGate.tsx" <<'TSX'
// apps/web/src/ui/ClaimPanelsGate.tsx
"use client";
import React from "react";
export default function ClaimPanelsGate({ show, children }:{ show:boolean; children:React.ReactNode }){
  if (!show) return null;
  return <>{children}</>;
}
TSX

# -------- 3) ClarifyPanel (professionell; inline "Sonstiges…") ----------
write "$WEB/ui/ClarifyPanel.tsx" <<'TSX'
// apps/web/src/ui/ClarifyPanel.tsx
"use client";
import React from "react";

export type Hints = {
  level?: "eu"|"bund"|"land"|"kommune"|"unsicher"|"other";
  region?: string|"bundesweit"|"unsicher";
  timeframe?: "aktuell"|"12m"|"5y"|"1990"|"unsicher"|"other";
  audience?: "buerger"|"unternehmen"|"staat"|"jugend"|"rentner"|"unsicher"|"other";
  stance?: "pro"|"neutral"|"contra"|"unsicher";
  other?: { level?: string; region?: string; timeframe?: string; audience?: string; };
};

function Chip({
  active, onClick, children, title
}:{active?:boolean; onClick:()=>void; children:React.ReactNode; title?:string}){
  return (
    <button type="button" title={title}
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm
                  ${active?'bg-sky-50 border-sky-300':'hover:bg-slate-50 border-slate-200'}
                 `}>
      {children}
    </button>
  );
}

function OtherRow({label, value, onChange}:{label:string; value?:string; onChange:(v:string)=>void}){
  const [open,setOpen]=React.useState<boolean>(!!value);
  return (
    <div className="ml-2">
      <button type="button" className="px-3 py-1 rounded-full border text-sm hover:bg-slate-50"
              onClick={()=>setOpen(v=>!v)}>Sonstiges…</button>
      {open && (
        <div className="mt-2">
          <input
            className="w-full rounded-lg border p-2 text-sm"
            placeholder={label}
            value={value||""}
            onChange={e=>onChange(e.target.value)}
          />
          <div className="text-xs text-slate-500 mt-1">Freitext – nur ausfüllen, wenn hilfreich.</div>
        </div>
      )}
    </div>
  );
}

export default function ClarifyPanel({
  hints, onChange
}:{hints:Hints; onChange:(h:Hints)=>void}){
  const set = (patch: Partial<Hints>) => onChange({ ...hints, ...patch });

  return (
    <div className="space-y-4 mt-2">
      <div className="text-[13px] text-slate-600 font-medium">Schritt 2: Klären (optional)</div>
      <div className="text-xs text-slate-500 -mt-1">Je präziser, desto besser die Vorschläge. Alles freiwillig.</div>

      {/* Zuständigkeit */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">Zuständigkeit</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={hints.level==="eu"} onClick={()=>set({level:"eu"})}>EU</Chip>
          <Chip active={hints.level==="bund"} onClick={()=>set({level:"bund"})}>Bund</Chip>
          <Chip active={hints.level==="land"} onClick={()=>set({level:"land"})}>Land</Chip>
          <Chip active={hints.level==="kommune"} onClick={()=>set({level:"kommune"})}>Kommune</Chip>
          <Chip active={hints.level==="unsicher"} onClick={()=>set({level:"unsicher"})}>Unsicher</Chip>
          <OtherRow label="Zuständigkeit (frei)" value={hints.other?.level}
                    onChange={(v)=>set({level:"other", other:{...(hints.other||{}), level:v}})} />
        </div>
      </div>

      {/* Ort/Region */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">Ort/Region</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={hints.region==="bundesweit"} onClick={()=>set({region:"bundesweit"})}>Bundesweit</Chip>
          <Chip active={!!(hints.region && hints.region!=="unsicher" && hints.region!=="bundesweit")}
                onClick={()=>{ /* toggled by input below */ }}>Stadt/Region…</Chip>
          <Chip active={hints.region==="unsicher"} onClick={()=>set({region:"unsicher"})}>Unsicher</Chip>
        </div>
        <div className="ml-2">
          <input
            className="w-full rounded-lg border p-2 text-sm"
            placeholder="z. B. Berlin, Neukölln (optional)"
            value={(typeof hints.region==="string" && hints.region!=="bundesweit" && hints.region!=="unsicher") ? String(hints.region) : ""}
            onChange={(e)=>set({region:e.target.value||undefined})}
          />
        </div>
      </div>

      {/* Zeitraum */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">Zeitraum</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={hints.timeframe==="aktuell"} onClick={()=>set({timeframe:"aktuell"})}>Aktuell</Chip>
          <Chip active={hints.timeframe==="12m"} onClick={()=>set({timeframe:"12m"})}>Letzte 12 Monate</Chip>
          <Chip active={hints.timeframe==="5y"} onClick={()=>set({timeframe:"5y"})}>Letzte 5 Jahre</Chip>
          <Chip active={hints.timeframe==="1990"} onClick={()=>set({timeframe:"1990"})}>Seit 1990</Chip>
          <Chip active={hints.timeframe==="unsicher"} onClick={()=>set({timeframe:"unsicher"})}>Unsicher</Chip>
          <OtherRow label="Zeitraum (frei)" value={hints.other?.timeframe}
                    onChange={(v)=>set({timeframe:"other", other:{...(hints.other||{}), timeframe:v}})} />
        </div>
      </div>

      {/* Betroffene */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">Betroffene</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={hints.audience==="buerger"} onClick={()=>set({audience:"buerger"})}>Bürger*innen</Chip>
          <Chip active={hints.audience==="unternehmen"} onClick={()=>set({audience:"unternehmen"})}>Unternehmen</Chip>
          <Chip active={hints.audience==="staat"} onClick={()=>set({audience:"staat"})}>Staat/Verwaltung</Chip>
          <Chip active={hints.audience==="jugend"} onClick={()=>set({audience:"jugend"})}>Kinder/Jugendliche</Chip>
          <Chip active={hints.audience==="rentner"} onClick={()=>set({audience:"rentner"})}>Rentner*innen</Chip>
          <Chip active={hints.audience==="unsicher"} onClick={()=>set({audience:"unsicher"})}>Unsicher</Chip>
          <OtherRow label="Betroffene (frei)" value={hints.other?.audience}
                    onChange={(v)=>set({audience:"other", other:{...(hints.other||{}), audience:v}})} />
        </div>
      </div>

      {/* Haltung – für Tonalität später */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">Haltung (optional)</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={hints.stance==="pro"} onClick={()=>set({stance:"pro"})}>Pro</Chip>
          <Chip active={hints.stance==="neutral"} onClick={()=>set({stance:"neutral"})}>Neutral</Chip>
          <Chip active={hints.stance==="contra"} onClick={()=>set({stance:"contra"})}>Contra</Chip>
          <Chip active={hints.stance==="unsicher"} onClick={()=>set({stance:"unsicher"})}>Unsicher</Chip>
        </div>
      </div>
    </div>
  );
}
TSX

# -------- 4) contributions/new – professionelle Seite (mit Backup) ----------
write "$WEB/app/contributions/new/page.tsx" <<'TSX'
// apps/web/src/app/contributions/new/page.tsx
"use client";

import React from "react";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import CounterSynth from "@/components/analyze/CounterSynth";
import ClaimPanelsGate from "@/ui/ClaimPanelsGate";
import InPlaceHUD from "@/ui/InPlaceHUD";
import ClarifyPanel, { Hints } from "@/ui/ClarifyPanel";

type Claim = { text: string; confidence?: number; meta?: any };

export default function ContributionNewPage() {
  // Schritt 1: Beitrag
  const [text, setText] = React.useState<string>(
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("text") ?? "")
      : ""
  );

  // Ergebnis
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [activeClaimIdx, setActiveClaimIdx] = React.useState<number>(0);

  // Panels erst nach explizitem Klick (Schritt 3)
  const [showPanels, setShowPanels] = React.useState(false);

  // UX / HUD
  const [analyzing, setAnalyzing] = React.useState<boolean>(false);
  const [hud, setHud] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Schritt 2: Klären
  const [hints, setHints] = React.useState<Hints>({});

  // Guards
  const activeClaim: Claim | null = claims[activeClaimIdx] ?? null;
  const canShowPanels = !!(showPanels && !analyzing && activeClaim?.text);

  // Index einklemmen, falls sich Anzahl verändert
  React.useEffect(() => {
    if (activeClaimIdx > claims.length - 1) {
      setActiveClaimIdx(Math.max(0, claims.length - 1));
    }
  }, [claims.length, activeClaimIdx]);

  function pushHud(line: string) {
    setHud((h) => [...h.slice(-6), line]); // max 7 Zeilen
  }

  async function runAnalysis() {
    const t0 = Date.now();
    setAnalyzing(true);
    setErrorMsg(null);
    setClaims([]);
    setActiveClaimIdx(0);
    setShowPanels(false);
    setHud([]);

    try {
      pushHud("Schritt 1 → Text prüfen …");
      const payload: any = {
        text: String(text || "").slice(0, 8000),
        maxClaims: 4,
        hints, // werden serverseitig aktuell ignoriert – zukunftssicher übergeben
      };

      pushHud("Schritt 2 → Modelle orchestrieren & Claims extrahieren …");
      const res = await fetch("/api/contributions/analyze?mode=multi&clarify=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({} as any));

      const apiClaims: Claim[] = Array.isArray(j?.claims) ? j.claims : [];
      const cleaned = apiClaims
        .map((c) => ({
          text: String((c as any)?.text ?? "").trim(),
          confidence: (c as any)?.confidence,
          meta: (c as any)?.meta,
        }))
        .filter((c) => c.text.length > 0);

      if (cleaned.length === 0) {
        if (text.trim()) {
          // Fallback: Gesamteingabe als Claim
          cleaned.push({ text: text.trim() });
          pushHud("Hinweis: Kein strukturierter Claim gefunden – Fallback verwendet.");
        } else {
          pushHud("Hinweis: Kein Inhalt – bitte Text eingeben.");
        }
      }

      setClaims(cleaned);
      setActiveClaimIdx(0);

      const took = ((Date.now() - t0) / 1000).toFixed(1);
      pushHud(`Fertig: ${cleaned.length} Claim(s) · ${took}s`);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setErrorMsg(msg);
      pushHud("Fehler: " + msg);
    } finally {
      setAnalyzing(false);
    }
  }

  function goQuick() {
    const claimText = (activeClaim?.text || text || "").slice(0, 500);
    const u = new URL("/statements/new", window.location.origin);
    if (claimText) u.searchParams.set("text", claimText);
    window.location.href = u.toString();
  }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-4">Beitrag erstellen &amp; analysieren</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte: Text + Klären + (gated) Panels */}
        <div className="lg:col-span-2 space-y-4">
          <div className="vog-card p-4 space-y-3">
            <div className="text-[13px] text-slate-600 font-medium">Schritt 1: Beitrag</div>
            <textarea
              className="w-full min-h-[200px] rounded-2xl border p-3"
              placeholder="Schreibe deinen Beitrag/These…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* Schritt 2: optionale Klärung direkt unter dem Text */}
            <ClarifyPanel hints={hints} onChange={setHints} />

            {/* Inline-Fortschritt (Chat-artig) */}
            <InPlaceHUD log={hud} analyzing={analyzing} label="Analyse" />

            <div className="flex gap-2 items-center">
              <button
                className="vog-btn-pri"
                onClick={runAnalysis}
                disabled={!text || analyzing}
              >
                {analyzing ? "Analysiere…" : "Analyse starten"}
              </button>
              <button
                className="vog-btn"
                onClick={goQuick}
                disabled={!text}
                title="Direkt mit dem ersten Claim weiter"
              >
                Schnell-Flow
              </button>
            </div>

            {/* evtl. Fehlermeldung */}
            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

            {/* Claim-Auswahl (falls mehrere) */}
            {claims.length > 1 && (
              <div className="pt-2">
                <div className="text-xs text-slate-500 mb-1">Gefundene Claims</div>
                <div className="flex flex-wrap gap-2">
                  {claims.map((c, i) => (
                    <button
                      key={i}
                      className={
                        "vog-chip " + (i === activeClaimIdx ? "ring-2 ring-sky-400" : "")
                      }
                      onClick={() => setActiveClaimIdx(i)}
                      title={c.text}
                    >
                      Claim {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schritt 3: Panels erst auf Klick */}
            {claims.length > 0 && !showPanels && (
              <div className="pt-2">
                <button className="vog-btn" onClick={() => setShowPanels(true)}>
                  Schritt 3: Vertiefen – Alternativen, Einwände & Essenz anzeigen
                </button>
              </div>
            )}
          </div>

          {/* Gated: erst rendern, wenn sinnvoll */}
          <ClaimPanelsGate show={canShowPanels}>
            <>
              {/* Alternativen / Lager-Spektrum */}
              <StanceSpectrum claimText={activeClaim?.text || ""} />

              {/* Einwände & Argumente (später an Haupt-Claim bindbar) */}
              <ObjectionCollector />

              {/* Quick-Essenz (hier als „Essenz“ – bleibt schlank) */}
              <CounterSynth text={activeClaim?.text || ""} />
            </>
          </ClaimPanelsGate>
        </div>

        {/* Rechte Spalte: dezent, kein „Aktuelle Recherche“ Overload */}
        <div className="space-y-3">
          <div className="vog-card p-4 text-sm">
            <div className="font-medium mb-1">Hinweis</div>
            Du kannst jederzeit abbrechen – <b>eDebatte</b> unterstützt auf Wunsch
            Redaktion &amp; Belege. Präzisierungen sind freiwillig.
          </div>
        </div>
      </div>
    </div>
  );
}
TSX

# -------- 5) Admin Usage Summary (POST) ----------
write "$WEB/app/api/admin/usage/summary/route.ts" <<'TS'
import { NextResponse } from "next/server";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rec = {
  ts?: number;
  route?: string;
  model?: string|null;
  totalTokens?: number|null;
  ms?: number;
  ok?: boolean;
  err?: string|null;
  meta?: any;
};

export async function POST(){
  try{
    const file = process.env.VOG_USAGE_FILE || "/tmp/vog_usage.jsonl";
    if (!fs.existsSync(file)) {
      return NextResponse.json({
        ok:true, summary:{ total:0, ok:0, failed:0, totalTokens:0, avgMs:0, lastTs:null, byRoute:{} }
      }, { status:200 });
    }
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
    let total=0, ok=0, failed=0, totalTokens=0, totalMs=0, lastTs:number|null=null;
    const byRoute: Record<string, { total:number; ok:number; failed:number }> = {};

    for (const ln of lines) {
      total++;
      let rec: Rec = {};
      try { rec = JSON.parse(ln); } catch { /* skip */ }
      if (rec.ok) ok++; else failed++;
      if (typeof rec.totalTokens === "number") totalTokens += rec.totalTokens!;
      if (typeof rec.ms === "number") totalMs += rec.ms!;
      if (typeof rec.ts === "number") lastTs = lastTs===null ? rec.ts! : Math.max(lastTs, rec.ts!);
      const r = String(rec.route||"unknown");
      byRoute[r] = byRoute[r] || { total:0, ok:0, failed:0 };
      byRoute[r].total += 1;
      if (rec.ok) byRoute[r].ok += 1; else byRoute[r].failed += 1;
    }

    const avgMs = total ? Math.round(totalMs/total) : 0;
    return NextResponse.json({ ok:true, summary:{ total, ok, failed, totalTokens, avgMs, lastTs, byRoute } }, { status:200 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:200 });
  }
}
TS

echo "✅ UI-Revision installiert. Bitte 'pnpm dev' neu laden und Seite öffnen: /contributions/new"
