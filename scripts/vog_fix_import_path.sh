#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
STEP="$ROOT/apps/web/src/app/pipeline/steps/analyze_multi_llm.ts"

if [[ ! -f "$STEP" ]]; then
  echo "❌ Step fehlt: $STEP"
  exit 1
fi

# Ersetze JEGLICHE(n) bestehende(n) analyze_multi_llm-Import durch den korrekten Alias
perl -0777 -pe 's@import\s+\{\s*step_analyze_multi_llm\s*\}\s+from\s*["\'].*analyze_multi_llm.*?["\'];@import { step_analyze_multi_llm } from "@/app/pipeline/steps/analyze_multi_llm";@s' \
  "$ROUTE" > "$ROUTE.tmp" && mv "$ROUTE.tmp" "$ROUTE"

echo "✓ Import in $ROUTE korrigiert."
echo "→ Dev-Server neu starten:"
echo "   rm -rf apps/web/.next && pnpm --filter @vog/web dev"
