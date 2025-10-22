#!/usr/bin/env bash
set -euo pipefail

# Ziel-Dateien (Monorepo – beide Varianten patchen, falls vorhanden)
FILES=(
  "apps/web/src/features/analyze/analyzeContribution.ts"
  "features/analyze/analyzeContribution.ts"
)

for F in "${FILES[@]}"; do
  [[ -f "$F" ]] || continue

  # a) Messages: text -> input_text
  sed -i '' 's/type: "text"/type: "input_text"/g' "$F"

  # b) text.format: json -> json_object
  perl -0777 -pe 's/text:\s*\{\s*format:\s*"json"\s*\}/text: { format: "json_object" }/g' -i '' "$F"

  # c) Sicherheitshalber JSON-Erwähnung im Systemprompt erzwingen (lowercase "json")
  perl -0777 -pe 's/(Du bist .*?Antwort[e|en]?.*?)(JSON)/$1json/si' -i '' "$F"

  # d) Koerzieren-Funktion-Name sicherstellen (coerceToAnalyzeResult existiert & wird benutzt)
  perl -0777 -pe 's/\bcoerce\(/coerceToAnalyzeResult(/g' -i '' "$F"
done

echo "✓ Responses-API Patch angewendet."
