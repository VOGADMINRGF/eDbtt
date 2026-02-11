#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found in PATH." >&2
  exit 1
fi

echo "==> Available scripts (workspace)"
if out=$(pnpm -r run --list 2>/dev/null); then
  echo "$out"
else
  echo "==> Fallback: package.json scripts via pnpm -r exec node"
  pnpm -r exec node -e "const p=require('./package.json'); const s=Object.keys(p.scripts||{}).join(', '); console.log(process.cwd()+': '+s);" || true
fi

echo "==> Lint (repo-wide)"
if ! out=$(pnpm -r run lint 2>&1); then
  echo "$out"
  if echo "$out" | grep -qiE "missing script|command \"lint\" not found|no script named \"lint\""; then
    echo "==> Repo-wide lint not available, falling back to apps/web"
    pnpm -C apps/web run lint
  else
    exit 1
  fi
else
  echo "$out"
fi

echo "==> Typecheck (repo-wide)"
if ! out=$(pnpm -r run typecheck 2>&1); then
  echo "$out"
  if echo "$out" | grep -qiE "missing script|command \"typecheck\" not found|no script named \"typecheck\""; then
    echo "==> Repo-wide typecheck not available, falling back to apps/web"
    if ! out_web=$(pnpm -C apps/web run typecheck 2>&1); then
      echo "$out_web"
      if echo "$out_web" | grep -qiE "missing script|command \"typecheck\" not found|no script named \"typecheck\""; then
        echo "==> apps/web typecheck script missing, running tsc"
        pnpm -C apps/web exec tsc -p tsconfig.json --noEmit
      else
        exit 1
      fi
    else
      echo "$out_web"
    fi
  else
    exit 1
  fi
else
  echo "$out"
fi
