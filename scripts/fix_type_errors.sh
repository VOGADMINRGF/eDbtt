#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

echo "➕ AdminConfig-Typen augmentieren…"
mkdir -p "$ROOT/apps/web/src/types"
cat > "$ROOT/apps/web/src/types/augment-admin-config.d.ts" <<'TS'
/**
 * Augmentation: AdminConfig um UI-Felder erweitern.
 * Greift nur zur Typzeit – ändert KEINE Runtime-Struktur.
 */
declare interface AdminConfig {
  pricing?: {
    membershipMonthlyEUR: number
    postImmediateEUR: number
    swipeToPostThresholds: number[]
  }
  limits: {
    newsfeedMaxPerRun: number
    factcheckMaxPerItemTokens?: number
    enableAutoPost?: boolean
  }
}
TS
echo "✅ AdminConfig-augmentation geschrieben"

# 2) analyzeContribution(text, [category]) -> analyzeContribution(text)
STATEMENTS_ROUTE="$ROOT/apps/web/src/app/api/statements/route.ts"
if [ -f "$STATEMENTS_ROUTE" ]; then
  echo "🛠  Korrigiere analyzeContribution-Aufruf in $STATEMENTS_ROUTE"
  sed -i '' 's/analyzeContribution(text, \[category\])/analyzeContribution(text)/' "$STATEMENTS_ROUTE" || true
fi

# 3) SidebarNav erfordert items-Prop -> leeres Array
DASH_LAYOUT="$ROOT/features/dashboard/components/DashboardLayout.tsx"
if [ -f "$DASH_LAYOUT" ]; then
  echo "🛠  Ergaenze items Prop in $DASH_LAYOUT"
  sed -i '' 's/<SidebarNav \/>/<SidebarNav items={[]} \/>/' "$DASH_LAYOUT" || true
fi

echo "✅ Fertig. Jetzt Typecheck erneut laufen lassen:"
echo "   pnpm --filter @vog/web run typecheck"
