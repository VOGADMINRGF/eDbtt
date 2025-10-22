#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"

ROUTE="$WEB/src/app/api/contributions/analyze/route.ts"
STEP="$WEB/src/app/pipeline/steps/analyze_multi_llm.ts"
FEED_DIR="$WEB/core/feeds"
FEED_FILE="$FEED_DIR/civic_feeds.de.json"

echo "→ Prüfe Analyze-Step…"
if [[ ! -f "$STEP" ]]; then
  echo "   WARN: $STEP fehlt – lege Minimal-Stub an."
  mkdir -p "$(dirname "$STEP")"
  cat > "$STEP" <<'TS'
import { orchestrateContribution } from "@/features/ai/orchestrator_contrib";

export async function step_analyze_multi_llm(text: string, { maxClaims = 5 }: { maxClaims?: number } = {}) {
  const prompt = [
    "Analysiere den Bürgertext und gib NUR gültiges JSON (RFC8259) zurück.",
    "Schema: {",
    '  "language": "de"|"en"|null,',
    '  "mainTopic": string|null,',
    '  "subTopics": string[],',
    '  "regionHint": string|null,',
    '  "claims": [ { "text": string, "categoryMain": string|null, "categorySubs": string[], "region": string|null, "authority": string|null } ],',
    '  "news": [], "scoreHints": { "baseWeight": number, "reasons": string[] }, "cta": null',
    "}",
    `Beachte: maximal ${maxClaims} Claims; keine Erklärtexte.`,
    "Text:",
    text
  ].join("\n");

  const { runs, best } = await orchestrateContribution(prompt, { json: true });
  if (!best?.text) {
    return { parsed: { language:null, mainTopic:null, subTopics:[], regionHint:null, claims:[], news:[], scoreHints:null, cta:null }, meta: { mode:"multi", errors:["no-best"], runs, picked:null } };
  }
  let parsed: any = {};
  try { parsed = JSON.parse(best.text); } catch { parsed = { language:null, mainTopic:null, subTopics:[], regionHint:null, claims:[], news:[], scoreHints:null, cta:null }; }
  return { parsed, meta: { mode:"multi", errors:null, runs, picked: (best as any).provider } };
}
TS
fi

echo "→ Korrigiere Import in API-Route…"
if [[ -f "$ROUTE" ]]; then
  # Ersetze jeden falschen Pfad auf den korrekten Alias "@/app/…"
  sed -i '' 's#@/apps/web/src/app/pipeline/steps/analyze_multi_llm#@/app/pipeline/steps/analyze_multi_llm#g' "$ROUTE" || true
  sed -i '' 's#@/apps/web/src/app/pipeline/steps/analyze_multi_llm.ts#@/app/pipeline/steps/analyze_multi_llm#g' "$ROUTE" || true
  sed -i '' 's#@/apps/web/src/app/pipeline/steps/analyze_multi_llm["'\'']#@/app/pipeline/steps/analyze_multi_llm#g' "$ROUTE" || true

  # Falls gar kein Import vorhanden ist, füge ihn oben ein
  if ! grep -q 'step_analyze_multi_llm' "$ROUTE"; then
    tmp="$ROUTE.tmp"
    {
      echo 'import { step_analyze_multi_llm } from "@/app/pipeline/steps/analyze_multi_llm";'
      cat "$ROUTE"
    } > "$tmp"
    mv "$tmp" "$ROUTE"
  fi
else
  echo "   WARN: $ROUTE nicht gefunden – bitte Verzeichnis prüfen."
fi

echo "→ Feeds-Datei anlegen…"
mkdir -p "$FEED_DIR"
if [[ ! -f "$FEED_FILE" ]]; then
  cat > "$FEED_FILE" <<'JSON'
{
  "feeds": [
    {
      "url": "https://www.tagesschau.de/xml/rss2",
      "region": "DE",
      "kind": "news",
      "trust": 0.9
    },
    {
      "url": "https://www.berlin.de/presse/mitteilungen/index/feed",
      "region": "DE:BE",
      "kind": "gov",
      "trust": 0.9
    }
  ]
}
JSON
  echo "   ✓ $FEED_FILE geschrieben (Minimal-Seed)."
else
  echo "   ✓ $FEED_FILE existiert – unverändert."
fi

echo "→ Next.js Cache leeren…"
rm -rf "$WEB/.next" 2>/dev/null || true

echo "→ Fertig. Starte dev neu:"
echo "   pnpm --filter @vog/web dev"
