#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Suche Analyzer-Dateien…"
# alle potenziellen Analyzer-Dateien einsammeln
mapfile -t FILES < <(
  git ls-files | grep -E '/features/.*/analyzeContribution\.ts$|/core/gpt/analyzeContribution\.ts$' || true
)

if [[ ${#FILES[@]} -eq 0 ]]; then
  # Fallback: alles nach Namen durchsuchen
  mapfile -t FILES < <(find . -type f -name 'analyzeContribution.ts' | sort)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "✗ Keine analyzeContribution.ts gefunden."
  exit 1
fi

for F in "${FILES[@]}"; do
  echo "⚙️  Patche: $F"

  # a) Responses-API: content[].type "text" -> "input_text"
  perl -0777 -i -pe 's/type:\s*"text"\s*,\s*text:/type: "input_text", text:/g' "$F"

  # b) text.format: "json" -> "json_object"
  perl -0777 -i -pe 's/text:\s*\{\s*format:\s*"json"\s*\}/text: { format: "json_object" }/g' "$F"

  # c) Systemprompt: explizit "json" (klein) erwähnen
  perl -0777 -i -pe 's/Antworte\s+\*\*NUR\*\*\s+mit\s+JSON\./Antworte **NUR** mit JSON (json)./g' "$F"

  # d) Zusätzlich den User-Text mit "format: json" präfixen (erfüllt die API-Anforderung zuverlässig)
  perl -0777 -i -pe 's/text:\s*text\.slice\(\s*0\s*,\s*8000\s*\)/text: "format: json\\n\\n" + text.slice(0, 8000)/g' "$F"
done

echo "✅ Responses-API Patch fertig."
echo "🔍 Quick-Check:"
for F in "${FILES[@]}"; do
  echo "— $F"
  grep -n 'input_text' "$F" || true
  grep -n 'json_object' "$F" || true
  grep -n 'format: json' "$F" || true
done

echo "ℹ️  Starte jetzt dein Dev neu, damit der Code neu gebaut wird."
