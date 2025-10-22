#!/usr/bin/env bash
set -euo pipefail

echo "— analyzer (OpenAI -> JSON)…"
curl -sS -X POST http://127.0.0.1:3000/api/contributions/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"Kommunen fordern mehr Mittel für Katastrophenschutz in NRW.","maxClaims":3}' | jq .

echo "— force ARI fallback (if ARI_ANALYZE_URL/YOUCOM_RESEARCH_URL is set)…"
curl -sS -X POST http://127.0.0.1:3000/api/contributions/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"Test ARI Fallback","forceFallback":true}' | jq .
