#!/usr/bin/env bash
set -euo pipefail

# 1) Offline (nur Heuristik) – kann leer sein, ist nur zum Vergleich
echo "— offline:"
curl -sS -X POST http://127.0.0.1:3000/api/contributions/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"Kommunen fordern mehr Mittel für Katastrophenschutz in NRW.","mode":"offline","maxClaims":3}' | jq .

# 2) GPT-5 Thinking (Responses API)
echo "— gpt:"
curl -sS -X POST http://127.0.0.1:3000/api/contributions/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"Kommunen fordern mehr Mittel für Katastrophenschutz in NRW.","mode":"gpt","maxClaims":3}' | jq .

# 3) Draft anlegen & updaten (richtige jq / JSON-Form)
echo "— draft create:"
ID=$(
  curl -sS -X POST http://127.0.0.1:3000/api/drafts \
    -H 'content-type: application/json' \
    -d '{"kind":"contribution","text":"Test","analysis":{"claims":[{"text":"Aussage X"}]}}' | jq -r .id
)
echo "ID=$ID"

echo "— draft patch:"
curl -sS -X PATCH "http://127.0.0.1:3000/api/drafts/$ID" \
  -H 'content-type: application/json' \
  -d '{"analysis":{"claims":[{"text":"Aussage X","impact":5}]}}' | jq .
