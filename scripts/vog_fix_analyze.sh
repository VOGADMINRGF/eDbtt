#!/usr/bin/env bash
set -euo pipefail

root="$(pwd)"

# 0) Wrapper-Syntax reparieren (kaputter MAP-Eintrag)
wrap="$root/features/analyze/wrapper.ts"
if grep -n "mica|krypto|bitcoin" "$wrap" >/dev/null 2>&1; then
  # sichere Kopie
  cp "$wrap" "$wrap.bak.$(date +%s)"
  # ersetze die kaputte Zeile durch korrektes Tupel
  perl -0777 -pe 's#/\b\(mica\|krypto\|bitcoin\|wallet\|defi\)\b/i as unknown as RegExp,\s*\{ domain: "Finanzen & Steuern", topic: "Krypto-Regulierung" \}\]\s*as any,#[/\\b(mica|krypto|bitcoin|wallet|defi)\\b/i, { domain: "Finanzen & Steuern", topic: "Krypto-Regulierung" }],#g' -i "$wrap"
fi

# 1) API: /api/contributions/analyze (Next App Router)
apiAnalyze="$root/apps/web/src/app/api/contributions/analyze/route.ts"
mkdir -p "$(dirname "$apiAnalyze")"
cat >"$apiAnalyze" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { extractV4 } from "@features/analyze/wrapper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, maxClaims } = await req.json().catch(() => ({}));
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text missing" }, { status: 400 });
    }
    // Heuristische Extraktion (kostenfrei, offline)
    const data = extractV4(text);
    const claims = Array.isArray(data?.claims) ? data.claims : [];

    // Limit für /new, unbegrenzt für /analyze
    const limited = typeof maxClaims === "number"
      ? claims.slice(0, Math.max(1, maxClaims))
      : claims;

    // Default-Werte für UI
    const withDefaults = limited.map((c: any) => ({
      ...c,
      impact: c.impact ?? 3,          // 1–5 Sterne (Relevanz intern)
      scope:  c.scope  ?? 3,          // 1–5 Punkte (Gesellschaftlicher Umfang)
    }));

    return NextResponse.json({ ...data, claims: withDefaults });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "fail" }, { status: 500 });
  }
}
TS

# 2) Draft-APIs (falls nicht vorhanden/abweichend)
apiDraftsBase="$root/apps/web/src/app/api/drafts"
mkdir -p "$apiDraftsBase" "$apiDraftsBase/[id]"

cat >"$apiDraftsBase/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { createDraft } from "@/server/draftStore";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const draft = createDraft(body);
  return NextResponse.json({ ok: true, id: draft.id, draft });
}
TS

cat >"$apiDraftsBase/[id]/route.ts" <<'TS'
import { NextResponse } from "next/server";
import { patchDraft, getDraft } from "@/server/draftStore";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await getDraft(params.id);
  return NextResponse.json(doc ?? { error: "not_found" }, { status: doc ? 200 : 404 });
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await patchDraft(params.id, body);
  return NextResponse.json(res);
}
TS

# 3) /contributions/new – Client-Page (max. 3 Claims, Sterne + Umfang)
pageNew="$root/apps/web/src/app/contributions/new/page.tsx"
mkdir -p "$(dirname "$pageNew")"
cat >"$pageNew" <<'TS'
/* @ts-nocheck */
"use client";
import React, { useState } from "react";

function ScopeDots({ value, onChange }: { value: number; onChange: (v:number)=>void }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {[1,2,3,4,5].map((n) => (
        <button key={n}
          onClick={() => onChange(n)}
          aria-label={`Gesellschaftlicher Umfang: ${n}`}
          style={{
            width: 14, height: 14, borderRadius: "50%",
            background: n <= value
              ? "linear-gradient(90deg, #14b8a6 0%, #60a5fa 100%)"
              : "#e5e7eb",
            boxShadow: n <= value ? "0 2px 6px rgba(20,184,166,.35)" : "none",
            border: "none"
          }}
        />
      ))}
    </div>
  );
}

export default function NewContribution() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [draftId, setDraftId] = useState<string>();

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/contributions/analyze", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, maxClaims: 3 }),
      }).then(res => res.json());

      r.claims = (r.claims || []).map((c: any) => ({
        ...c,
        impact: c.impact ?? 3,
        scope:  c.scope  ?? 3,
      }));
      setResult(r);

      const d = await fetch("/api/drafts", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "contribution", text,
          analysis: r, status: "light",
          createdAt: new Date().toISOString(),
        }),
      }).then(res => res.json());
      setDraftId(d.id);
    } finally { setLoading(false); }
  };

  const patchClaims = async (claims: any[]) => {
    setResult((prev:any) => ({ ...prev, claims }));
    if (draftId) {
      await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ "analysis.claims": claims }),
      });
    }
  };

  const updateImpact = (i:number, v:number) => {
    const next = structuredClone(result);
    next.claims[i].impact = v;
    patchClaims(next.claims);
  };
  const updateScope = (i:number, v:number) => {
    const next = structuredClone(result);
    next.claims[i].scope = v;
    patchClaims(next.claims);
  };

  return (
    <div style={{maxWidth:1000, margin:"0 auto", padding:20}}>
      <h1 style={{fontSize:34, fontWeight:800, marginBottom:12}}>Beitrag erstellen & analysieren</h1>

      <textarea
        placeholder="Schreibe deinen Beitrag/These…"
        value={text} onChange={(e)=>setText(e.target.value)}
        style={{width:"100%", minHeight:180, border:"1px solid #e5e7eb", borderRadius:8, padding:12}}
      />
      <div style={{marginTop:10}}>
        <button disabled={loading} onClick={analyze}
          style={{padding:"8px 14px", background:"#111827", color:"#fff", borderRadius:8, opacity:loading?0.6:1}}>
          {loading ? "Analysiere…" : "Analyse starten"}
        </button>
      </div>

      <div style={{marginTop:16, border:"1px solid #e5e7eb", borderRadius:8, padding:12}}>
        <div style={{fontWeight:700, marginBottom:8}}>Analyse-Pipeline</div>
        <ul style={{marginLeft:18}}>
          <li>Vorverarbeitung</li><li>Kanon-Mapping (Tier-1/Tier-2)</li>
          <li>Duplikate/Region</li><li>Quellen</li><li>Faktencheck</li><li>Trust-Score</li>
        </ul>
      </div>

      {result?.claims?.length ? (
        <div style={{marginTop:16}}>
          <div style={{fontWeight:700, marginBottom:8}}>Extrahierte Kernaussagen (max. 3)</div>

          {result.claims.map((c:any,i:number)=>(
            <div key={i} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginBottom:12}}>
              <div style={{fontWeight:700, marginBottom:6}}>Aussage {i+1}</div>
              <div style={{marginBottom:6}}>{c.text}</div>
              <div style={{color:"#6b7280", marginBottom:8}}>Thema: <b>{c.categoryMain ?? "—"}</b></div>

              <div style={{display:"flex", gap:16, alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12, color:"#6b7280"}}>Relevanz</div>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={()=>updateImpact(i, star)}
                      style={{background:"transparent", border:"none", fontSize:20,
                              color:(c.impact ?? 3) >= star ? "#f59e0b" : "#e5e7eb"}}>★</button>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12, color:"#6b7280"}}>Gesellschaftlicher Umfang</div>
                  <ScopeDots value={c.scope ?? 3} onChange={(v)=>updateScope(i,v)} />
                </div>
              </div>
            </div>
          ))}

          <div style={{display:"flex", gap:8}}>
            <a href="/contributions/analyze" style={{padding:"8px 14px", background:"#111827", color:"#fff", borderRadius:8}}>
              Vollanalyse (Pro)
            </a>
            <a href="#" style={{padding:"8px 14px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#111827"}}>
              Als Entwurf speichern
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
TS

# 4) /contributions/analyze – Client-Page (unbegrenzt)
pageAnalyze="$root/apps/web/src/app/contributions/analyze/page.tsx"
mkdir -p "$(dirname "$pageAnalyze")"
cat >"$pageAnalyze" <<'TS'
/* @ts-nocheck */
"use client";
import React, { useState } from "react";

function ScopeDots({ value, onChange }: { value: number; onChange: (v:number)=>void }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {[1,2,3,4,5].map((n) => (
        <button key={n}
          onClick={() => onChange(n)}
          aria-label={`Gesellschaftlicher Umfang: ${n}`}
          style={{
            width: 14, height: 14, borderRadius: "50%",
            background: n <= value
              ? "linear-gradient(90deg, #14b8a6 0%, #60a5fa 100%)"
              : "#e5e7eb",
            boxShadow: n <= value ? "0 2px 6px rgba(20,184,166,.35)" : "none",
            border: "none"
          }}
        />
      ))}
    </div>
  );
}

export default function AnalyzeContribution() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/contributions/analyze", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      }).then(res => res.json());
      r.claims = (r.claims || []).map((c:any)=>({ ...c, impact: c.impact ?? 3, scope: c.scope ?? 3 }));
      setResult(r);
    } finally { setLoading(false); }
  };

  const update = (i:number, patch:Partial<any>) => {
    setResult((prev:any) => {
      const next = structuredClone(prev);
      next.claims[i] = { ...next.claims[i], ...patch };
      return next;
    });
  };

  return (
    <div style={{maxWidth:1100, margin:"0 auto", padding:20}}>
      <h1 style={{fontSize:34, fontWeight:800, marginBottom:12}}>Beitrag erstellen & analysieren</h1>

      <textarea
        placeholder="Dein Text…"
        value={text} onChange={(e)=>setText(e.target.value)}
        style={{width:"100%", minHeight:180, border:"1px solid #e5e7eb", borderRadius:8, padding:12}}
      />
      <div style={{marginTop:10}}>
        <button disabled={loading} onClick={analyze}
          style={{padding:"8px 14px", background:"#111827", color:"#fff", borderRadius:8, opacity:loading?0.6:1}}>
          {loading ? "Analysiere…" : "Analyse starten"}
        </button>
      </div>

      {result?.claims?.length ? (
        <div style={{marginTop:16}}>
          <div style={{fontWeight:700, marginBottom:8}}>
            Ergebnisse • Sprache: {result.language || "—"} • Hauptthema: {result.mainTopic || "—"}
          </div>

          {result.claims.map((c:any,i:number)=>(
            <div key={i} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginBottom:12}}>
              <div style={{fontWeight:700, marginBottom:6}}>Aussage {i+1}</div>
              <div style={{marginBottom:6}}>{c.text}</div>
              <div style={{color:"#6b7280", marginBottom:8}}>
                Thema: <b>{c.categoryMain ?? "—"}</b>
                {c.categorySubs?.length ? <> • Sub: {c.categorySubs.join(", ")}</> : null}
              </div>

              <div style={{display:"flex", gap:16, alignItems:"center", flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:12, color:"#6b7280"}}>Relevanz</div>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={()=>update(i, { impact: star })}
                      style={{background:"transparent", border:"none", fontSize:20,
                              color:(c.impact ?? 3) >= star ? "#f59e0b" : "#e5e7eb"}}>★</button>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12, color:"#6b7280"}}>Gesellschaftlicher Umfang</div>
                  <ScopeDots value={c.scope ?? 3} onChange={(v)=>update(i,{scope:v})} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
TS

# 5) admin-config: lokalen Import nutzen (kein @vog/config/* nötig)
cfg="$root/apps/web/src/config/admin-config.ts"
mkdir -p "$(dirname "$cfg")"
cat >"$cfg" <<'TS'
export type { AdminConfig, PricingConfig, PipelineLimits, RegionPilot } from "../../../../packages/config/admin-config";
export { adminConfig } from "../../../../packages/config/admin-config";
export default adminConfig;
TS

echo "✓ Analyse-Flow, Pages und API verdrahtet. Starte jetzt:  pnpm --filter @vog/web dev"
