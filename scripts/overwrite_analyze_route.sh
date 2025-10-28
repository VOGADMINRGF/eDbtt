#!/usr/bin/env bash
set -euo pipefail
API="apps/web/src/app/api/contributions/analyze/route.ts"
mkdir -p "$(dirname "$API")"
cat > "$API" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { orchestrateClaim } from "@/features/ai/orchestrator_claims";
import { orchestrateMany } from "@/features/ai/orchestrator_many";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ ok:false, error: "Kein Text übergeben." }, { status: 400 });
    }

    const modeParam = req.nextUrl.searchParams.get("mode");
    const MODE = (modeParam || process.env.VOG_ANALYZE_MODE || "orchestrated-many").toLowerCase();

    if (MODE === "orchestrated-many" || req.nextUrl.searchParams.get("multi") === "1") {
      const out = await orchestrateMany(text);
      return NextResponse.json({ ok:true, stage:"orchestrated-many", ...out }, { status:200, headers:{ "cache-control":"no-store" }});
    }

    if (MODE === "orchestrated") {
      const out = await orchestrateClaim(text);
      return NextResponse.json({ ok:true, stage:"orchestrated", ...out }, { status:200, headers:{ "cache-control":"no-store" }});
    }

    // Fallback: alte Einzel-Analyse
    const result = await analyzeContribution(text, { maxClaims: Number(body?.maxClaims ?? 5) });
    return NextResponse.json({ ok:true, stage:"legacy-single", result }, { status:200, headers:{ "cache-control":"no-store" }});

  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message || e) }, { status: 500 });
  }
}
TS
echo "✓ Überschrieben: $API"
