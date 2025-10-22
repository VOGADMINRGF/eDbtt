#!/usr/bin/env bash
set -e
curl -sS -H 'content-type: application/json' \
  -d '{"text":"Kurzer Testbeitrag.","maxClaims":2}' \
  'http://127.0.0.1:3000/api/contributions/analyze?mode=gpt' \
| jq '{claims, mainTopic, _meta}'
