#!/usr/bin/env bash
set -euo pipefail
mkdir -p tools/reperatur/reports

echo "Node: $(node -v || true)"
echo "PNPM: $(pnpm -v || true)"
echo "TS: $(pnpm -w exec tsc -v || true)"

echo "Install workspace deps (skip if already done)..."
pnpm -w install || true

echo "Prisma generate (monorepo-aware)..."
SCHEMAS=( "prisma/schema.prisma" "prisma/core/schema.prisma" "prisma/web/schema.prisma" )
for s in "${SCHEMAS[@]}"; do
  if [ -f "$s" ]; then
    echo "↳ prisma generate --schema=$s"
    pnpm -w exec prisma generate --schema="$s" || true
  fi
done

echo "TypeScript: collect errors (workspace) ..."
ts_log="tools/reperatur/reports/tsc-$(date +%Y%m%d-%H%M%S).log"
if pnpm -w exec tsc -b >"$ts_log" 2>&1; then
  echo "Saved (build-mode): $ts_log"
else
  echo "Build-mode failed, fallback to --noEmit"
  pnpm -w exec tsc --noEmit >"$ts_log" 2>&1 || true
  echo "Saved (noEmit): $ts_log"
fi
