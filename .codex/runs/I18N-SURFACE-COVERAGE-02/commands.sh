#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "== Repository status =="
git status --short

echo "== Resolve available package manager =="
if [[ -f pnpm-lock.yaml ]]; then
  PM="pnpm"
elif [[ -f yarn.lock ]]; then
  PM="yarn"
elif [[ -f package-lock.json ]]; then
  PM="npm"
else
  echo "No supported lockfile found. Stop and inspect repository scripts manually."
  exit 1
fi

echo "Using: $PM"

echo "== Show relevant scripts =="
node -e 'const p=require("./package.json"); console.log(JSON.stringify(p.scripts || {}, null, 2))'

run_if_present() {
  local script="$1"
  if node -e 'const p=require("./package.json"); process.exit(p.scripts && p.scripts[process.argv[1]] ? 0 : 1)' "$script"; then
    echo "== Running $script =="
    "$PM" run "$script"
  else
    echo "== Skipping missing root script: $script =="
  fi
}

run_if_present lint
run_if_present typecheck
run_if_present test

echo "== Run focused I18N contract test when a supported runner is available =="
if [[ "$PM" == "pnpm" ]]; then
  pnpm exec vitest run apps/web/tests/i18n-surface-coverage.contract.test.ts || {
    echo "Focused Vitest command failed or is not the repository's canonical runner. Use the closest existing test script and document the exact command."
    exit 1
  }
elif [[ "$PM" == "yarn" ]]; then
  yarn vitest run apps/web/tests/i18n-surface-coverage.contract.test.ts || {
    echo "Focused Vitest command failed or is not the repository's canonical runner. Use the closest existing test script and document the exact command."
    exit 1
  }
else
  npx vitest run apps/web/tests/i18n-surface-coverage.contract.test.ts || {
    echo "Focused Vitest command failed or is not the repository's canonical runner. Use the closest existing test script and document the exact command."
    exit 1
  }
fi

echo "== Final status =="
git status --short
