#!/usr/bin/env bash
set -euo pipefail
mkdir -p tools/reperatur/output

echo "Git diff snapshot..."
git diff > tools/reperatur/output/patch-$(date +%Y%m%d-%H%M%S).diff || true
echo "Patch saved under tools/reperatur/output/"
