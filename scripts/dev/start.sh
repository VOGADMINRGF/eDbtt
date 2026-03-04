#!/usr/bin/env bash
set -euo pipefail

PROFILE=${PROFILE:-}
if [ "$PROFILE" = "graph" ]; then
  docker compose --profile graph up -d
else
  docker compose up -d
fi

echo "✅ Infra gestartet."
echo "Jetzt: pnpm dev"
