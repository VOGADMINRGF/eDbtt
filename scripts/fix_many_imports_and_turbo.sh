#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
WEB="$ROOT/apps/web"
PKG="$ROOT/package.json"

ROUTE1="$WEB/src/app/api/contributions/analyze/route.ts"
ROUTE2="$WEB/src/app/api/analyze/stream/route.ts"

echo "▶ Repo: $ROOT"

# --- A) turbo-Version korrigieren (2.5.8 existiert) ---
if [ -f "$PKG" ]; then
node - "$PKG" <<'NODE'
const fs=require('fs');
const p=process.argv[1];
const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
pkg.devDependencies = pkg.devDependencies || {};
pkg.devDependencies.turbo = "2.5.8"; // existiert laut Registry
fs.writeFileSync(p, JSON.stringify(pkg,null,2));
console.log("✓ package.json: turbo auf 2.5.8 gesetzt");
NODE
else
  echo "❌ package.json nicht gefunden"
  exit 1
fi

# --- B) API-Routen: Alias-Imports -> relative Imports ---
patch_file () {
  local FILE="$1"
  [ -f "$FILE" ] || { echo "ℹ Datei fehlt (übersprungen): $FILE"; return; }
  node - "$FILE" <<'NODE'
const fs=require('fs'); const path=process.argv[1];
let s=fs.readFileSync(path,'utf8');

// Beiträge-Analyze-Route
s = s.replace(/from ["']@\/features\/ai\/orchestrator_many["']/g, "from '../../../../features/ai/orchestrator_many'");
s = s.replace(/from ["']@\/features\/ai\/orchestrator_claims["']/g, "from '../../../../features/ai/orchestrator_claims'");
s = s.replace(/from ["']@\/features\/analyze\/analyzeContribution["']/g, "from '../../../../features/analyze/analyzeContribution'");

// SSE-Route (falscher Alias + falscher Pfad)
s = s.replace(/from ["']@\/src\/features\/ai\/orchestrator_many["']/g, "from '../../../../features/ai/orchestrator_many'");
s = s.replace(/from ["']@\/features\/ai\/orchestrator_many["']/g, "from '../../../../features/ai/orchestrator_many'");

fs.writeFileSync(path, s);
console.log("✓ Gepatcht:", path);
NODE
}

patch_file "$ROUTE1"
patch_file "$ROUTE2"

# --- C) Install + kurzer Build-Check nur für apps/web ---
if command -v pnpm >/dev/null 2>&1; then
  echo "▶ pnpm install (Lockfile wird aktualisiert)"
  pnpm install --prefer-offline
  echo "▶ tsc check (apps/web)"
  pnpm --filter @vog/web exec tsc --noEmit || true
else
  echo "⚠ pnpm nicht gefunden – bitte zuerst corepack enable && corepack use pnpm@10"
fi

echo "✅ Fix done: turbo 2.5.8 + Imports relativ"
