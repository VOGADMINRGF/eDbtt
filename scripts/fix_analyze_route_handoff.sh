#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"

backup() { [ -f "$1" ] && cp "$1" "$1.bak.$(date +%s)"; }

echo "→ Patching $ROUTE (multi → extract handoff + stable JSON)…"
backup "$ROUTE"
cat > "$ROUTE" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as analyzeMulti } from "@/features/ai/orchestrator_contrib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// softer Usage-Logger (niemals crashen)
async function recordUsageSafe(e:any){
  try{
    const m = await import("@/lib/metrics/usage");
    if (typeof (m as any).recordUsage === "function") await (m as any).recordUsage(e);
  }catch{}
}

// garantiert _meta + claims, auch bei Fehlern
function forceStable(out:any, ms:number, note?:string){
  const base = { _meta: { mode: "error", errors: note ? [note] : [], tookMs: ms }, claims: [] as any[] };
  if (!out || typeof out !== "object") return base;
  if (!("_meta" in out)) return { ...base, result: out };
  if (!("claims" in out)) return { ...out, claims: [] };
  return out;
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  let ok = false, err: string|null = null, model: string|null = null, totalTokens: number|null = null;

  try{
    const u = new URL(req.url);
    const mode  = u.searchParams.get("mode") || process.env.VOG_ANALYZE_MODE || "gpt";
    const body  = await req.json().catch(()=> ({}));
    const text  = String(body?.text ?? "").trim().slice(0, 8000);
    const maxClaims = Number(body?.maxClaims ?? 3);

    if (!text) {
      const ms = Date.now()-t0;
      const payload = forceStable(null, ms, "no-text");
      ok = true;
      return NextResponse.json(payload, { status: 200 });
    }

    if (mode === "multi") {
      // 1) Orchestrator laufen lassen
      const orches = await analyzeMulti(text, { maxClaims });
      const bestText = String(orches?.best?.text ?? text);

      // 2) Claims-Extraktion über bestText (Fallback: Rohtext)
      let extracted = await analyzeContribution(bestText, { maxClaims });

      // Meta zusammenführen
      extracted._meta = {
        ...(extracted._meta ?? {}),
        mode: "multi+extract",
        tookMs: Date.now()-t0,
        provider: orches?.best?.provider ?? null,
      };

      // ein paar Nutzwerte herausziehen (falls vorhanden)
      model       = (extracted?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
      totalTokens = (extracted?._meta?.usage?.total_tokens ?? null) as any;

      ok = true;
      return NextResponse.json(forceStable(extracted, extracted._meta.tookMs), { status: 200 });
    }

    // Standard: reine Claim-Extraktion
    const out = await analyzeContribution(text, { maxClaims });
    out._meta = { ...(out._meta ?? {}), mode: "gpt", tookMs: Date.now()-t0 };
    model       = (out?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
    totalTokens = (out?._meta?.usage?.total_tokens ?? null) as any;
    ok = true;
    return NextResponse.json(forceStable(out, out._meta.tookMs), { status: 200 });

  }catch(e:any){
    err = String(e?.message || e);
    const ms = Date.now()-t0;
    const payload = forceStable(null, ms, err);
    return NextResponse.json(payload, { status: 200 });

  }finally{
    await recordUsageSafe({
      ts: Date.now(),
      route: "/api/contributions/analyze",
      userId: null,
      model, totalTokens,
      ms: Date.now()-t0, ok, err,
      meta: { source: "handoff" }
    });
  }
}
TS
echo "✓ Done."
