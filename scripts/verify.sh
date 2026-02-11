#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found in PATH." >&2
  exit 1
fi

echo "==> Lint (apps/web)"
pnpm -C apps/web run lint

echo "==> Clean apps/web .next"
rm -rf "$ROOT/apps/web/.next" || true

echo "==> Typecheck (apps/web)"
pnpm -C apps/web run typecheck
