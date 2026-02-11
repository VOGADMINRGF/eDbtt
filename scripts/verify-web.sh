#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/apps/web"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found in PATH." >&2
  exit 1
fi

echo "==> Available scripts (apps/web)"
if out=$(pnpm run --list 2>/dev/null); then
  echo "$out"
else
  echo "==> Fallback: package.json scripts via node"
  node -e "const p=require('./package.json'); const s=Object.keys(p.scripts||{}).join(', '); console.log(s);" || true
fi

echo "==> Lint (apps/web)"
pnpm run lint

echo "==> Typecheck (apps/web)"
if ! out=$(pnpm run typecheck 2>&1); then
  echo "$out"
  if echo "$out" | grep -qiE "missing script|command \"typecheck\" not found|no script named \"typecheck\""; then
    echo "==> apps/web typecheck script missing, running tsc"
    pnpm exec tsc -p tsconfig.json --noEmit
  else
    exit 1
  fi
else
  echo "$out"
fi
