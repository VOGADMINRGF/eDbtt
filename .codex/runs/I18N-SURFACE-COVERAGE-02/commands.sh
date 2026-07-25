#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ "${CODEX_PREFLIGHT_PASSED:-}" != "I18N-SURFACE-COVERAGE-02" ]]; then
  cat <<'EOF'
Refusing to run implementation verification.

This pilot task is already documented as done on current main.
Run Prompt 0 first. Only a future, explicitly restored codex_ready state may set:

  CODEX_PREFLIGHT_PASSED=I18N-SURFACE-COVERAGE-02

No tests were run.
EOF
  exit 2
fi

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
  pnpm exec vitest run apps/web/tests/i18n-surface-coverage.contract.test.ts
elif [[ "$PM" == "yarn" ]]; then
  yarn vitest run apps/web/tests/i18n-surface-coverage.contract.test.ts
else
  npx vitest run apps/web/tests/i18n-surface-coverage.contract.test.ts
fi

echo "== Final status =="
git status --short
