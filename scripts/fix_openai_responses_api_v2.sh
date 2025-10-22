#!/usr/bin/env bash
set -euo pipefail

echo "↪ suche analyzeContribution.ts…"
mapfile -t FILES < <(find . -type f -name 'analyzeContribution.ts' | sort)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "✗ keine analyzeContribution.ts gefunden. Pfad anders? (find . -name analyzeContribution.ts)"
  exit 1
fi

for F in "${FILES[@]}"; do
  echo "⚙️  patche: $F"

  # a) Responses-API: content[].type "text" -> "input_text"
  perl -0777 -i -pe 's/type:\s*"text"\s*,\s*text:/type: "input_text", text:/g' "$F"

  # b) text.format: "json" -> "json_object"
  perl -0777 -i -pe 's/text:\s*\{\s*format:\s*"json"\s*\}/text: { format: "json_object" }/g' "$F"

  # c) Stelle sicher, dass im Systemprompt irgendwo "json" (klein) vorkommt
  #    (Responses-API verlangt das bei text.format=json_object).
  perl -0777 -i -pe 's/Antworte\s+\*\*NUR\*\*\s+mit\s+JSON\./Antworte **NUR** mit JSON (json)./g' "$F"

  # d) Safety: falls in der Datei coerceToAnalyzeResult() heißt, aber auf coerce() verwiesen wurde
  perl -0777 -i -pe 's/\bcoerce\(/coerceToAnalyzeResult(/g' "$F"
done

echo "✓ Responses-API Patch fertig."
echo "→ Quick-Check:"
for F in "${FILES[@]}"; do
  grep -n 'input_text' "$F" || true
  grep -n 'json_object' "$F" || true
done
