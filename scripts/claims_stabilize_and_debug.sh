# Speichere als scripts/claims_stabilize_and_debug.sh und führe aus
cat > scripts/claims_stabilize_and_debug.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

patch () { local f="$1"; local tmp="$f.tmp.$$"; mkdir -p "$(dirname "$f")"; cp "$f" "$f.bak.$(date +%s)" 2>/dev/null || true; cat > "$tmp"; mv "$tmp" "$f"; echo "✓ wrote: $f"; }

ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
patch "$ROUTE" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as analyzeMulti } from "@/features/ai/orchestrator_contrib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function recordUsageSafe(e:any){ try{ const m = await import("@/lib/metrics/usage"); const fn=(m as any).recordUsage; if (typeof fn==="function") await fn(e);}catch{} }

function fallbackClaimFromText(text:string){
  const t = String(text||"").trim();
  if (!t) return null;
  const isPrice = /preiserh[oö]hung|preise|tarif/i.test(t);
  return {
    text: t, categoryMain: isPrice ? "Wirtschaft" : null,
    categorySubs: isPrice ? ["Preise","Tarife"] : [],
    region: null, authority: null, canon: null,
    specificity: 0.2, needsClarify: isPrice
  };
}

function stabilize(out:any, ms:number, mode:string, extra?:any){
  const base = { _meta:{ mode, errors:null as any, tookMs:ms, ...extra }, claims:[] as any[] };
  if (!out || typeof out!=="object") return base;
  if (!("_meta" in out)) out._meta = { mode, errors:null, tookMs:ms, ...extra };
  if (!("claims" in out)) out.claims = [];
  return out;
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  let ok=false, err:string|null=null, model:string|null=null, totalTokens:number|null=null;
  try{
    const u     = new URL(req.url);
    const mode  = u.searchParams.get("mode") || process.env.VOG_ANALYZE_MODE || "gpt";
    const debug = u.searchParams.get("debug")==="1";
    const body  = await req.json().catch(()=> ({}));
    const text  = String(body?.text ?? "").trim().slice(0, 8000);
    const maxClaims = Math.max(1, Number(body?.maxClaims ?? 3));
    if (!text) return NextResponse.json(stabilize(null, Date.now()-t0, mode), { status:200 });

    if (mode==="multi"){
      const orch = await analyzeMulti(text, { maxClaims });
      // Für die Extraktion IMMER den Originaltext verwenden (nicht das Provider-Reply)
      let extracted = await analyzeContribution(text, { maxClaims });
      if (!Array.isArray(extracted?.claims) || extracted.claims.length===0){
        const fc = fallbackClaimFromText(text);
        if (fc) extracted = { ...(extracted||{}), claims:[fc] };
      }
      extracted = stabilize(extracted, Date.now()-t0, "multi+extract", { provider: orch?.best?.provider ?? null, gptMs: extracted?._meta?.gptMs ?? null, gptText: null });
      model       = (extracted?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
      totalTokens = (extracted?._meta?.usage?.total_tokens ?? null) as any;
      ok = true;
      if (debug) (extracted as any).debug = orch;
      return NextResponse.json(extracted, { status:200 });
    }

    // Standard: reine Extraktion
    let out = await analyzeContribution(text, { maxClaims });
    if (!Array.isArray(out?.claims) || out.claims.length===0){
      const fc = fallbackClaimFromText(text);
      if (fc) out = { ...(out||{}), claims:[fc] };
    }
    out = stabilize(out, Date.now()-t0, "gpt", { gptMs: out?._meta?.gptMs ?? null, gptText: null });
    model       = (out?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
    totalTokens = (out?._meta?.usage?.total_tokens ?? null) as any;
    ok = true;
    return NextResponse.json(out, { status:200 });

  }catch(e:any){
    err = String(e?.message || e);
    const payload = stabilize(null, Date.now()-t0, "error");
    payload._meta.errors = [err];
    return NextResponse.json(payload, { status:200 });
  }finally{
    await recordUsageSafe({ ts:Date.now(), route:"/api/contributions/analyze", userId:null,
      model, totalTokens, ms: Date.now()-t0, ok, err, meta:{ source:"stabilize+debug" } });
  }
}
TS

# Kleines Gate-UI, damit Panels erst NACH Claims erscheinen
GATE="$ROOT/apps/web/src/ui/ClaimPanelsGate.tsx"
cat > "$GATE" <<'TSX'
"use client";
import React from "react";
export default function ClaimPanelsGate({
  claims, children, placeholder
}:{claims?: any[]; children: React.ReactNode; placeholder?: React.ReactNode;}){
  const has = Array.isArray(claims) && claims.length>0;
  return has ? <>{children}</> : (placeholder ?? null);
}
TSX
echo "✓ wrote: $GATE"

echo "— Fertig. Bitte neu starten bzw. Hot-Reload abwarten."
SH

chmod +x scripts/claims_stabilize_and_debug.sh
bash scripts/claims_stabilize_and_debug.sh
