#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/apps/web"
ROUTE="$WEB/src/app/api/contributions/analyze/route.ts"
STEP_DIR="$WEB/src/app/pipeline/steps"
STEP_FILE="$STEP_DIR/analyze_multi_llm.ts"

echo "→ Sicherstelle Step-Datei…"
mkdir -p "$STEP_DIR"
if [ ! -f "$STEP_FILE" ]; then
  cat > "$STEP_FILE" <<'TS'
// apps/web/src/app/pipeline/steps/analyze_multi_llm.ts
import type { AnalyzeResult } from "@/features/analyze/analyzeContribution";
import { analyzeContribution } from "@/features/analyze/analyzeContribution"; // Fallback
// Optional: echter Multi-LLM-Orchestrator einklinken, wenn vorhanden
// import { analyzeMulti } from "@/features/ai/orchestrator_contrib";

export async function step_analyze_multi_llm(
  text: string,
  opts: { maxClaims?: number; debug?: boolean } = {}
): Promise<AnalyzeResult> {
  // Platzhalter: bis der Orchestrator vorhanden ist, nehmen wir GPT-Analyse:
  const out = await analyzeContribution(text, { maxClaims: opts.maxClaims, debug: opts.debug });
  return out;
}
TS
  echo "✓ Step angelegt: $STEP_FILE"
else
  echo "✓ Step vorhanden: $STEP_FILE"
fi

echo "→ Schreibe robuste API-Route…"
mkdir -p "$(dirname "$ROUTE")"
cat > "$ROUTE" <<'TS'
// apps/web/src/app/api/contributions/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { step_analyze_multi_llm } from "@/app/pipeline/steps/analyze_multi_llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, init: ResponseInit = {}) {
  // vermeidet problematische NextResponse.json-Overloads in manchen TS/Next-Kombis
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    const maxClaims = Number.isFinite(body?.maxClaims) ? Number(body.maxClaims) : undefined;
    const debug = Boolean(body?.debug);

    if (!text) {
      return json({ error: "Kein Text übergeben." }, { status: 400 });
    }

    const USE_MULTI =
      req.nextUrl?.searchParams?.get("mode") === "multi" ||
      process.env.VOG_ANALYZE_MODE === "multi";

    const result = USE_MULTI
      ? await step_analyze_multi_llm(text, { maxClaims, debug })
      : await analyzeContribution(text, { maxClaims, debug });

    return json(result, { status: 200 });
  } catch (e: any) {
    const msg = e?.message || String(e);
    return json({ error: msg }, { status: 500 });
  }
}
TS

echo "✓ Route geschrieben: $ROUTE"

# env default
ENVF="$WEB/.env.local"
touch "$ENVF"
grep -q '^VOG_ANALYZE_MODE=' "$ENVF" || echo 'VOG_ANALYZE_MODE=gpt' >> "$ENVF"
echo "✓ ENV default gesetzt (VOG_ANALYZE_MODE=gpt)"

echo "→ Fertig. Dev-Server ggf. neu starten:"
echo "   rm -rf apps/web/.next && pnpm --filter @vog/web dev"
