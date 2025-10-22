#!/usr/bin/env bash
set -e
curl -sS -X POST 'http://127.0.0.1:3000/api/search/civic' \
  -H 'content-type: application/json' \
  -d '{"topic":"ÖPNV","region":"Berlin","keywords":["Straßenbahn","Nahverkehr","BVG","Tarif"],"limit":6}' \
| jq .
