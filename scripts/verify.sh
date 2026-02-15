#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "[verify] root: $ROOT"

# 1) Lint (apps/web is the canonical UI surface)
pnpm -C apps/web run lint

# 2) Page contracts (H1/button semantics)
node ./scripts/check-page-contracts.mjs

# 2b) Decision Architecture drift validator
node --import tsx ./scripts/validate-decision-architecture.ts

# 3) Typecheck
#
# Next can generate `.next/types/...` that influence TS results. Clean it to avoid stale types.
rm -rf "$ROOT/apps/web/.next" || true

if pnpm -C apps/web run -s typecheck >/dev/null 2>&1; then
  pnpm -C apps/web run typecheck
else
  pnpm -C apps/web exec tsc -p tsconfig.json --noEmit
fi

echo "[verify] PASS"
