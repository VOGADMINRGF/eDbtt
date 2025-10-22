#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "→ Ensure pipeline step exists at src/app/pipeline/steps…"
mkdir -p "$ROOT/apps/web/src/app/pipeline/steps"

STEP_FILE="$ROOT/apps/web/src/app/pipeline/steps/analyze_multi_llm.ts"
if [ ! -f "$STEP_FILE" ]; then
  cat > "$STEP_FILE" <<'TS'
import type { AnalyzeResult } from "@/features/analyze/analyzeContribution";
import { analyzeMulti } from "@/features/ai/orchestrator_contrib";

export async function step_analyze_multi_llm(text:string, opts:{maxClaims?:number}={}): Promise<AnalyzeResult> {
  const out = await analyzeMulti({ text, maxClaims: opts.maxClaims });
  return {
    language: out.language,
    mainTopic: out.mainTopic,
    subTopics: out.subTopics,
    regionHint: out.regionHint,
    claims: out.claims,
    news: out.news,
    scoreHints: out.scoreHints,
    cta: null,
    _meta: {
      mode: out._meta.mode === "error" ? "error" : "gpt",
      errors: out._meta.mode === "error" ? ["multi-llm failed"] : null,
      tookMs: out._meta.tookMs,
      gptMs: undefined,
      gptText: null
    }
  };
}
TS
  echo "✓ wrote $STEP_FILE"
else
  echo "✓ step file already present"
fi

ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
if [ ! -f "$ROUTE" ]; then
  echo "✗ route.ts nicht gefunden unter $ROUTE"
  exit 1
fi

echo "→ Ensure import in route.ts…"
if ! grep -q "step_analyze_multi_llm" "$ROUTE"; then
  # ganz oben import einfügen
  sed -i '' '1i\
import { step_analyze_multi_llm } from "@/app/pipeline/steps/analyze_multi_llm";\
' "$ROUTE"
  echo "✓ import inserted"
else
  echo "✓ import already present"
fi

echo "→ Wire USE_MULTI switch…"
# Falls noch nicht vorhanden, ersetze den direkten analyzeContribution-Call durch den Umschalter.
if ! grep -q "VOG_ANALYZE_MODE" "$ROUTE"; then
  perl -0777 -i -pe '
    s/const\s+result\s*=\s*await\s*analyzeContribution\(\s*text\s*,\s*\{\s*maxClaims\s*\}\s*\)\s*;/
const USE_MULTI = (req.nextUrl?.searchParams?.get("mode") === "multi") || process.env.VOG_ANALYZE_MODE==="multi";
const result = USE_MULTI
  ? await step_analyze_multi_llm(text, { maxClaims })
  : await analyzeContribution(text, { maxClaims });/s
  ' "$ROUTE" || true
  echo "✓ switch patched (or already correct)"
else
  echo "✓ switch already present"
fi

echo "→ ENV hints…"
ENVF="$ROOT/apps/web/.env.local"
touch "$ENVF"
grep -q '^VOG_ANALYZE_MODE=' "$ENVF" || echo 'VOG_ANALYZE_MODE=gpt' >> "$ENVF"

echo "✓ Done. Neu starten: pnpm --filter @vog/web dev"
