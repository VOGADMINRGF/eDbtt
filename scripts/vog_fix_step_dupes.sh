#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
STEP_CANON="$WEB/src/app/pipeline/steps/analyze_multi_llm.ts"
STEP_ALT1="$WEB/src/pipeline/steps/analyze_multi_llm.ts"   # falscher Ort (ohne /app)
ROUTE="$WEB/src/app/api/contributions/analyze/route.ts"
TSC="$WEB/tsconfig.json"

echo "→ Prüfe Step-Dateien…"
mkdir -p "$(dirname "$STEP_CANON")"

# Falls nur die falsche Variante existiert → verschieben
if [[ ! -f "$STEP_CANON" && -f "$STEP_ALT1" ]]; then
  echo "• Verschiebe $STEP_ALT1 → $STEP_CANON"
  mv "$STEP_ALT1" "$STEP_CANON"
fi

# Falls beide existieren → Alt sichern, Canon behalten
if [[ -f "$STEP_CANON" && -f "$STEP_ALT1" ]]; then
  if ! diff -q "$STEP_CANON" "$STEP_ALT1" >/dev/null; then
    TS=$(date +%s)
    echo "• Unterschiedliche Duplikate gefunden – sichere Altdatei: $STEP_ALT1.bak.$TS"
    cp "$STEP_ALT1" "$STEP_ALT1.bak.$TS"
  fi
  rm -f "$STEP_ALT1"
fi

# Route-Import auf kanonischen Pfad bringen
if [[ -f "$ROUTE" ]]; then
  echo "→ Patche API-Route Import…"
  tmp="$(mktemp)"
  sed -E \
    -e 's#^import\s*\{\s*step_analyze_multi_llm\s*\}.*#import { step_analyze_multi_llm } from "@/app/pipeline/steps/analyze_multi_llm";#' \
    "$ROUTE" > "$tmp"
  mv "$tmp" "$ROUTE"
fi

# tsconfig prüfen/patchen (baseUrl & @-Alias) – KORRIGIERT
if [[ -f "$TSC" ]]; then
  echo "→ Patche tsconfig.json …"
  node -e '
    const fs = require("fs");
    const p = process.argv[1];
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j.compilerOptions = j.compilerOptions || {};
    if (!j.compilerOptions.baseUrl) j.compilerOptions.baseUrl = "./src";
    j.compilerOptions.paths = j.compilerOptions.paths || {};
    if (!j.compilerOptions.paths["@/*"]) j.compilerOptions.paths["@/*"] = ["*"];
    fs.writeFileSync(p, JSON.stringify(j, null, 2));
  ' "$TSC"
fi

echo "→ Fertig. Cache leeren & Dev neu starten:"
echo "   rm -rf apps/web/.next && pnpm --filter @vog/web dev"
