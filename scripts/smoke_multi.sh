#!/usr/bin/env bash
set -e
curl -sS -H 'content-type: application/json' \
  -d '{"text":"Ich bin gegen weitere Preiserhöhungen.","maxClaims":2}' \
  'http://127.0.0.1:3000/api/contributions/analyze?mode=multi' \
| jq '{claims, mainTopic, _meta:{mode, picked, errors}}'
