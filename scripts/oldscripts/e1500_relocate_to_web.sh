#!/usr/bin/env bash
set -euo pipefail

# Detect web app dir
if [ -d "apps/web" ]; then
  WEB_DIR="apps/web"
else
  echo "⚠️  Kein apps/web gefunden. Dann liegen deine Quellen wohl im Repo-Root und dieses Script ist nicht nötig."
  exit 0
fi

SRC_ROOT="src"
DST_ROOT="$WEB_DIR/src"

# Liste aller erzeugten/ergänzten Dateien aus dem Batch
FILES=(
  "app/admin/page.tsx"
  "app/admin/system/page.tsx"
  "app/admin/users/page.tsx"
  "app/admin/users/[id]/page.tsx"
  "app/admin/errors/[id]/page.tsx"

  "app/api/admin/errors/last24/route.ts"
  "app/api/admin/analytics/summary/route.ts"
  "app/api/admin/users/detail/route.ts"
  "app/api/health/system-matrix/route.ts"

  "app/api/reports/route.ts"
  "app/api/reports/[id]/route.ts"
  "app/reports/page.tsx"
  "app/reports/[id]/page.tsx"
  "features/report/components/ReportCard.tsx"
  "features/report/components/ReportList.tsx"

  "app/api/admin/streams/route.ts"
  "app/api/public/streams/route.ts"
  "app/stream/page.tsx"
  "features/stream/components/StreamCard.tsx"
  "features/stream/components/StreamList.tsx"
  "features/stream/components/StreamFilters.tsx"

  "app/api/contributions/route.ts"
  "app/contributions/page.tsx"
  "app/contributions/new/page.tsx"
  "features/contribution/components/ContributionForm.tsx"
  "features/contribution/components/ContributionList.tsx"
  "app/api/contributions/analytics/summary/route.ts"

  "app/api/factcheck/enqueue/route.ts"
  "app/api/factcheck/status/route.ts"
  "hooks/useFactcheckJob.ts"
  "worker/factcheck/worker.ts"           # bleibt außerhalb unter worker/, wird nicht verschoben

  "graph/arangoRepo.ts"
  "graph/syncStatementsToGraph.ts"

  "components/MiniAccordion.tsx"
  "components/PasswordField.tsx"
  "components/QuickRegister.tsx"
  "components/SetBuilder.tsx"
  "components/SiteHeader.tsx"
  "components/StreamForm.tsx"

  "config/accessControl.ts"
  "lib/contribution/storeContribution.ts"
  "utils/aiProviders.ts"
  "utils/jwt.ts"
  "utils/logger.ts"
  "utils/mongo/votes.ts"
)

moved=0
for f in "${FILES[@]}"; do
  SRC_PATH="$SRC_ROOT/$f"
  DST_PATH="$DST_ROOT/$f"
  if [ -f "$SRC_PATH" ]; then
    mkdir -p "$(dirname "$DST_PATH")"
    # kopieren (nicht verschieben), falls du Root-Varianten behalten willst
    cp -f "$SRC_PATH" "$DST_PATH"
    echo "✓ moved $SRC_PATH -> $DST_PATH"
    moved=$((moved+1))
  fi
done

# next.config.ts nach apps/web spiegeln, wenn Next im app-Paket liegt
if [ -f "next.config.ts" ]; then
  if [ ! -f "$WEB_DIR/next.config.ts" ]; then
    cp -f "next.config.ts" "$WEB_DIR/next.config.ts"
    echo "✓ mirrored next.config.ts -> $WEB_DIR/next.config.ts"
  fi
fi

# tailwind.config.js: falls du pro-App eine Konfig willst, spiegeln
if [ -f "tailwind.config.js" ]; then
  if [ ! -f "$WEB_DIR/tailwind.config.js" ]; then
    cp -f "tailwind.config.js" "$WEB_DIR/tailwind.config.js"
    echo "✓ mirrored tailwind.config.js -> $WEB_DIR/tailwind.config.js"
  fi
fi

echo "—"
echo "Fertig. Verschobene/gespiegelte Dateien: $moved"
echo "Starte jetzt den Dev-Server neu:"
echo "  pnpm dev   # bzw. im monorepo: turbo run dev"
