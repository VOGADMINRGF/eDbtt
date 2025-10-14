#!/usr/bin/env bash
# Idempotentes Verwalten von festen Egress-IP(s)/CIDRs in MongoDB Atlas.
# Auth: Atlas Admin API (HTTP Digest)

set -euo pipefail

: "${ATLAS_PUBLIC_KEY:?Missing ATLAS_PUBLIC_KEY}"
: "${ATLAS_PRIVATE_KEY:?Missing ATLAS_PRIVATE_KEY}"
: "${ATLAS_PROJECT_ID:?Missing ATLAS_PROJECT_ID}"

API="https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_PROJECT_ID}/accessList"

usage() {
  cat <<'EOF'
Usage:
  atlas-allow-fixed.sh list
  atlas-allow-fixed.sh add  [csv_ips]   # z.B. "203.0.113.10,198.51.100.0/24"
  atlas-allow-fixed.sh rm   [csv_ips]

Umgebung:
  ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, ATLAS_PROJECT_ID (Pflicht)
  ATLAS_FIXED_IPS  (optional; CSV der IPs/CIDRs als Default)
EOF
}

need_ips() {
  local csv="${1:-}"
  [[ -n "$csv" ]] || { echo "ERROR: keine IPs/CIDRs übergeben." >&2; exit 2; }
}

list() {
  curl --silent --show-error --digest \
    -u "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" \
    -H "Content-Type: application/json" \
    -X GET "$API" | jq .
}

add() {
  local csv="${1:-${ATLAS_FIXED_IPS:-}}"
  need_ips "$csv"

  IFS=, read -r -a arr <<<"$csv"
  # CSV -> JSON: ["1.2.3.4","5.6.7.0/24"] -> [{ipAddress:"..."},...]
  local body
  body="$(printf '%s\n' "${arr[@]}" \
        | jq -Rcn '[inputs|select(length>0)|gsub("\\s+";"")|{ipAddress:.}]')"

  echo "Hinzufügen (idempotent): $csv"
  curl --silent --show-error --digest \
    -u "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" \
    -H "Content-Type: application/json" \
    -X POST "$API" \
    --data "$body" | jq .
}

rm_ips() {
  local csv="${1:-${ATLAS_FIXED_IPS:-}}"
  need_ips "$csv"
  IFS=, read -r -a arr <<<"$csv"
  for ip in "${arr[@]}"; do
    ip="$(echo -n "$ip" | tr -d '[:space:]')"
    echo "Entferne: $ip"
    curl --silent --show-error --digest \
      -u "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" \
      -H "Content-Type: application/json" \
      -X DELETE "$API/${ip}" | jq .
  done
}

case "${1:-}" in
  list) list ;;
  add)  shift; add "${1:-}";;
  rm)   shift; rm_ips "${1:-}";;
  *)    usage; exit 1 ;;
esac
