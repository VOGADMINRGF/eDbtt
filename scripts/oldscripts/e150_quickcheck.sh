#!/usr/bin/env bash
set -e
BASE="${1:-http://localhost:3000}"
EXIT=0
say(){ printf "%s\n" "$@"; }

test_json () {
  local path="$1" msg="$2" jqexp="$3"
  if curl -sSf "$BASE$path" | jq -e "$jqexp" >/dev/null; then
    say "✅ $msg ($path)"
  else
    say "❌ $msg ($path)"; EXIT=1
  fi
}

test_json "/api/admin/analytics/summary"  "Admin Analytics erreichbar"          '.totals and (.totals|type=="object")'
test_json "/api/admin/errors/last24"       "Errors (24h) liefert JSON"          'type=="array"'
test_json "/api/health/system-matrix"      "SystemMatrix OK-Flag gesetzt"       '.ok != null and .targets|type=="array"'
test_json "/api/public/streams"            "Streams (public) listet Einträge"   'type=="array"'
test_json "/api/reports"                   "Reports API listet Einträge"        'type=="array"'
test_json "/api/contributions"             "Contributions API listet Einträge"  'type=="array"'

exit $EXIT
