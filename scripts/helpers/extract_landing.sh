#!/usr/bin/env bash
set -euo pipefail
OUT="_landing_extract"
rm -rf "${OUT}"
mkdir -p "${OUT}"
if [[ -d "apps/landing" ]]; then
  rsync -a --exclude node_modules --exclude .next apps/landing/ "${OUT}/"
  echo "[extract] landing copied to ${OUT}/ (ready to push as separate repo)"
else
  echo "[extract] apps/landing not found – skipping"
fi
