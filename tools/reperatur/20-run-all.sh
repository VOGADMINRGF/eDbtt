#!/usr/bin/env bash
set -euo pipefail
mkdir -p tools/reperatur/reports

echo "== Reperatur: Codemods (Dry-Run unless REPERATUR_WRITE=1) =="
WRITE=${REPERATUR_WRITE:-0}

node tools/reperatur/10-trimongo.mjs
node tools/reperatur/11-imports-prisma.mjs
node tools/reperatur/12-next-dynamic.mjs
node tools/reperatur/13-redis-upstash.mjs
node tools/reperatur/14-mongoose-indexes.mjs
node tools/reperatur/15-paths-tsconfig.mjs

echo "== ESLint --fix (optional) =="
if pnpm -w exec eslint -v >/dev/null 2>&1; then
  pnpm -w exec eslint . --ext .ts,.tsx --fix || true
else
  echo "ESLint not installed — skipping"
fi

echo "== Typecheck =="
if pnpm -w exec tsc -b >/dev/null 2>&1; then
  pnpm -w exec tsc -b || true
else
  pnpm -w exec tsc --noEmit || true
fi
