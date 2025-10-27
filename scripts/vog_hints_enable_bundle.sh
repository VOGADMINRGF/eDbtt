#!/usr/bin/env bash
set -euo pipefail

ts() { date +%s; }
write(){ # $1 = path ; stdin -> file (mit Backup)
  local f="$1"; local d; d="$(dirname "$f")"
  mkdir -p "$d"
  if [ -f "$f" ]; then cp "$f" "${f}.bak.$(ts)"; echo "• Backup: $f -> ${f}.bak.$(ts)"; fi
  cat > "$f"
  echo "✓ wrote $f"
}

ROOT="$(pwd)"
WEB="apps/web/src"
[ -d "$WEB" ] || { echo "✗ $WEB nicht gefunden (Repo-Root erwartet)"; exit 1; }

# 1) /api/quality/clarify – leichte Auto-Hints (nur Vorschläge)
write "$WEB/app/api/quality/clarify/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { runOpenAI } from "@/features/ai/providers/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Input: { text:string }
 * Output: { ok:true, hints:{ level, region, timeframe, audience, stance, other? } }
 * – alle Felder optional; nur Vorschläge (sanft, überschreibbar)
 */
export async function POST(req: NextRequest){
  try{
    const b = await req.json().catch(()=>({}));
    const raw = String(b?.text ?? "").trim();
    if (!raw) return NextResponse.json({ ok:true, hints:{} }, { status:200 });

    const sys = `
Du bist Assistent für sanfte, optionale Präzisierungen.
Extrahiere, falls aus dem Text ableitbar:

- "level": eine von ["eu","bund","land","kommune","unsicher","other"]
- "region": string oder "bundesweit" oder "unsicher"
- "timeframe": eine von ["aktuell","12m","5y","1990","unsicher","other"]
- "audience": eine von ["buerger","unternehmen","staat","jugend","rentner","unsicher","other"]
- "stance": eine von ["pro","neutral","contra","unsicher"]

Wenn unsicher, setze "unsicher". Verwende "other" nur, wenn klarer Freitext sinnvoll ist und liefere dann unter "other" passende Strings.
Antworte **STRICT JSON**:
{ "hints": { "level":..., "region":..., "timeframe":..., "audience":..., "stance":..., "other": { ... } } }
`.trim();

    const prompt = `Text:
"""${raw.slice(0, 4000)}"""
Gib nur das JSON-Objekt zurück.`;

    const r = await runOpenAI(prompt, { json:true, system: sys, timeoutMs: 12000 });
    if (!r.ok) return NextResponse.json({ ok:true, hints:{} }, { status:200 });

    let hints:any = {};
    try {
      const parsed = JSON.parse(r.text||"{}");
      if (parsed && typeof parsed==="object" && parsed.hints) hints = parsed.hints;
    } catch {}
    return NextResponse.json({ ok:true, hints: hints||{} }, { status:200 });
  }catch(e:any){
    return NextResponse.json({ ok:true, hints:{} }, { status:200 });
  }
}
TS

# 2) /api/contributions/analyze – Hints an den Analyzer durchreichen (editorSignals)
write "$WEB/app/api/contributions/analyze/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as analyzeMulti } from "@/features/ai/orchestrator_contrib";
import { runOpenAI } from "@/features/ai/providers/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJson<T=any>(s:string):T|null { try{return JSON.parse(s) as T;}catch{return null;} }

async function recordUsageSafe(e:any){
  try{ const m = await import("@/lib/metrics/usage"); const fn=(m as any)?.recordUsage;
       if (typeof fn==="function") await fn(e);
  }catch{}
}

async function extractClaimsFallback(text:string, maxClaims=3, hints?:any){
  const scopeLines:string[] = [];
  if (hints?.level) scopeLines.push(`Zuständigkeit (Hinweis): ${hints.level}`);
  if (hints?.region) scopeLines.push(`Region (Hinweis): ${hints.region}`);
  if (hints?.timeframe) scopeLines.push(`Zeitraum (Hinweis): ${hints.timeframe}`);
  const scope = scopeLines.length ? `Berücksichtige diese optionalen Hinweise:\n- ${scopeLines.join("\n- ")}\n` : "";

  const sys = `Extrahiere bis zu ${maxClaims} prägnante Claims in JSON.
Bevorzuge ausformulierte, prüfbare Sätze. ${scope}
Antwortformat STRICT:
{ "claims": [ { "text": string } ] }`;
  const prompt = `Text:
"""${text.slice(0,6000)}"""
Gib NUR das JSON-Objekt zurück.`;

  const r = await runOpenAI(prompt, { json:true, system: sys, timeoutMs: 16000 });
  if (!r.ok) return { claims: [], _meta:{ fallback:true, error:r.error??null } };

  const json = safeJson<{claims?:Array<{text:string}>}>(r.text?.trim()||"");
  const claims = Array.isArray(json?.claims) ? json!.claims.filter(c => typeof c?.text==="string" && c.text.trim()) : [];
  return { claims, _meta:{ fallback:true, model: process.env.OPENAI_MODEL??null, tookMs: r.ms, usage: r.usage } };
}

function forceStable(out:any, ms:number, note?:string){
  const base = { _meta:{ mode:"error", errors: note ? [note] : [], tookMs: ms }, claims: [] as any[] };
  if (!out || typeof out!=="object") return base;
  if (!("_meta" in out)) return { ...base, result: out };
  if (!("claims" in out)) return { ...out, claims: [] };
  return out;
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  let ok=false, err:string|null=null, model:string|null=null, totalTokens:number|null=null;

  try{
    const u = new URL(req.url);
    const mode  = u.searchParams.get("mode") || process.env.VOG_ANALYZE_MODE || "gpt";
    const body  = await req.json().catch(()=> ({}));
    const text  = String(body?.text ?? "").trim().slice(0, 8000);
    const maxClaims = Number(body?.maxClaims ?? 3);
    const hints = (body?.hints && typeof body.hints==="object") ? body.hints : undefined;

    if (!text) {
      const ms = Date.now()-t0;
      const payload = forceStable(null, ms, "no-text");
      ok = true;
      return NextResponse.json(payload, { status: 200 });
    }

    if (mode === "multi") {
      const orches = await analyzeMulti(text, { maxClaims }).catch(()=>null);
      const bestText = String(orches?.best?.text ?? text);

      let extracted = await analyzeContribution(bestText, {
        maxClaims,
        context: { editorSignals: { hints } },
      }).catch(()=>({ claims:[], _meta:{} as any }));

      if (!Array.isArray(extracted?.claims) || extracted.claims.length===0) {
        const fb = await extractClaimsFallback(bestText, maxClaims, hints);
        extracted = { ...(extracted||{}), claims: fb.claims, _meta: { ...(extracted?._meta??{}), fallbackUsed:true } };
      }

      extracted._meta = {
        ...(extracted._meta??{}),
        mode: "multi+extract",
        tookMs: Date.now()-t0,
        provider: orches?.best?.provider ?? null,
      };

      model       = (extracted?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
      totalTokens = (extracted?._meta?.usage?.total_tokens ?? null) as any;
      ok = true;
      return NextResponse.json(forceStable(extracted, extracted._meta.tookMs), { status: 200 });
    }

    // Standard: direkte Claim-Extraktion
    let out = await analyzeContribution(text, {
      maxClaims,
      context: { editorSignals: { hints } },
    }).catch(()=>({ claims:[], _meta:{} as any }));

    if (!Array.isArray(out?.claims) || out.claims.length===0) {
      const fb = await extractClaimsFallback(text, maxClaims, hints);
      out = { ...(out||{}), claims: fb.claims, _meta:{ ...(out?._meta??{}), fallbackUsed:true } };
    }

    out._meta = { ...(out._meta??{}), mode:"gpt", tookMs: Date.now()-t0 };
    model       = (out?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
    totalTokens = (out?._meta?.usage?.total_tokens ?? null) as any;
    ok = true;
    return NextResponse.json(forceStable(out, out._meta.tookMs), { status: 200 });

  }catch(e:any){
    err = String(e?.message||e);
    const ms = Date.now()-t0;
    const payload = forceStable(null, ms, err);
    return NextResponse.json(payload, { status: 200 });

  }finally{
    await recordUsageSafe({
      ts: Date.now(),
      route: "/api/contributions/analyze",
      userId: null, model, totalTokens,
      ms: Date.now()-t0, ok, err,
      meta: { source: "handoff" }
    });
  }
}
TS

# 3) contributions/new – Auto-Hints + robuste Guards (sanft, professionell)
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

  // Panels erst nach explizitem Klick
  const [showPanels, setShowPanels] = React.useState(false);

  // UX / HUD
  const [analyzing, setAnalyzing] = React.useState<boolean>(false);
  const [hud, setHud] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Schritt 2: Klären – Hints
  const [hints, setHints] = React.useState<Hints>({});
  const [hintsTouched, setHintsTouched] = React.useState<boolean>(false);

  // Guards
  const activeClaim: Claim | null = claims[activeClaimIdx] ?? null;
  const canShowPanels = !!(showPanels && !analyzing && activeClaim?.text);

  // Index einklemmen (stabil)
  React.useEffect(() => {
    if (activeClaimIdx > claims.length - 1) {
      setActiveClaimIdx(Math.max(0, claims.length - 1));
    }
  }, [claims.length, activeClaimIdx]);

  function pushHud(line: string) {
    setHud((h) => [...h.slice(-6), line]);
  }

  // Auto-Hints (sanft): nur wenn Nutzer*in nicht selbst editiert hat
  React.useEffect(() => {
    if (hintsTouched) return;
    const t = (text||"").trim();
    if (t.length < 60) return; // erst ab etwas Substanz
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try{
        const res = await fetch("/api/quality/clarify", {
          method:"POST",
          headers:{ "content-type":"application/json" },
          body: JSON.stringify({ text: t }),
          signal: ctrl.signal
        });
        const j = await res.json().catch(()=>({}));
        const h = (j?.hints && typeof j.hints==="object") ? j.hints : {};
        // sanft mergen: nur leere Felder ersetzen
        const merged: Hints = {
          level: hints.level ?? h.level,
          region: hints.region ?? h.region,
          timeframe: hints.timeframe ?? h.timeframe,
          audience: hints.audience ?? h.audience,
          stance: hints.stance ?? h.stance,
          other: { ...(hints.other||{}), ...(h.other||{}) }
        };
        setHints(merged);
        if (Object.keys(h||{}).length) pushHud("Klären: Vorschläge übernommen (optional).");
      }catch(e:any){
        /* still & friendly */
      }
    }, 700); // leichte Debounce
    return ()=>{ clearTimeout(timer); ctrl.abort(); };
  }, [text, hintsTouched]); // nur wenn Text sich ändert und hints nicht berührt wurden

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
        hints
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

  // Hints-Change wrapper: markiert als "Nutzer hat editiert"
  function onHintsChange(h:Hints){
    setHintsTouched(true);
    setHints(h);
  }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-4">Beitrag erstellen &amp; analysieren</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte */}
        <div className="lg:col-span-2 space-y-4">
          <div className="vog-card p-4 space-y-3">
            <div className="text-[13px] text-slate-600 font-medium">Schritt 1: Beitrag</div>
            <textarea
              className="w-full min-h-[200px] rounded-2xl border p-3"
              placeholder="Schreibe deinen Beitrag/These…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* Schritt 2: Klären – optional, mit sanften Auto-Vorschlägen */}
            <ClarifyPanel hints={hints} onChange={onHintsChange} />

            {/* Inline-Fortschritt (Chat-Feeling) */}
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

            {/* Fehler freundlich anzeigen */}
            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

            {/* Claim-Auswahl (falls mehrere) */}
            {claims.length > 1 && (
              <div className="pt-2">
                <div className="text-xs text-slate-500 mb-1">Gefundene Claims</div>
                <div className="flex flex-wrap gap-2">
                  {claims.map((c, i) => (
                    <button
                      key={i}
                      className={"vog-chip " + (i === activeClaimIdx ? "ring-2 ring-sky-400" : "")}
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

          {/* Gated Panels */}
          <ClaimPanelsGate show={canShowPanels}>
            <>
              <StanceSpectrum claimText={activeClaim?.text || ""} />
              <ObjectionCollector />
              <CounterSynth text={activeClaim?.text || ""} />
            </>
          </ClaimPanelsGate>
        </div>

        {/* Rechte Spalte: dezent */}
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

echo "✅ Patch fertig. Starte/refresh 'pnpm dev' und öffne /contributions/new"
