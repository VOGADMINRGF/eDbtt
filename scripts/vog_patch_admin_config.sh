#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"

echo "🧭 Verwende bestehenden Alias @packages/* statt @vog/*"

# 1) Admin-Config Re-Export sauber auf @packages umstellen
mkdir -p "$WEB/src/config"
cat > "$WEB/src/config/admin-config.ts" <<'TS'
export type { AdminConfig, PricingConfig, PipelineLimits, RegionPilot } from "@packages/config/admin-config";
export { adminConfig } from "@packages/config/admin-config";
export { adminConfig as default } from "@packages/config/admin-config";
TS
echo "✅ apps/web/src/config/admin-config.ts geschrieben"

# 2) Alte (falsche) Imports repo-weit umschreiben (falls vorhanden)
echo "🧹 Suche & ersetze alte Imports @vog/config/admin-config → @packages/config/admin-config"
find "$WEB/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 \
  | xargs -0 sed -i '' 's/@vog\/config\/admin-config/@packages\/config\/admin-config/g' || true
echo "✅ Import-Rewrites fertig"

# 3) Analyzer-Aufruf sicherstellen (1 Argument)
STATEMENTS="$WEB/src/app/api/statements/route.ts"
if [ -f "$STATEMENTS" ]; then
  sed -i '' 's/analyzeContribution(text, *\[.*\])/analyzeContribution(text)/g' "$STATEMENTS" || true
  sed -i '' 's/analysis\.categories/analysis\.subTopics/g' "$STATEMENTS" || true
  echo "✅ /api/statements auf analyzeContribution(text) vereinheitlicht"
fi

# 4) Startseite → /contributions/new
mkdir -p "$WEB/src/app"
cat > "$WEB/src/app/page.tsx" <<'TSX'
export default function Page() {
  if (typeof window !== "undefined") window.location.href = "/contributions/new";
  return null;
}
TSX
echo "✅ Startseite leitet auf /contributions/new"

echo "🎉 Done. Jetzt: pnpm --filter @vog/web run typecheck ; pnpm --filter @vog/web dev"
