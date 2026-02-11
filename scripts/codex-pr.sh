#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! git remote -v | grep -q "VOGADMINRGF/edebatte-org"; then
  echo "Falsches Repo/Verzeichnis" >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <PR-Nr>" >&2
  exit 1
fi

PR_RAW="$1"
if [[ "$PR_RAW" =~ ^[0-9]+$ ]]; then
  PR_NUM="$(printf "%04d" "$PR_RAW")"
else
  PR_NUM="$PR_RAW"
fi

PROMPT="pr-${PR_NUM}.prompt.md"
REPORT="pr-${PR_NUM}.last.md"

if [[ ! -f "$PROMPT" ]]; then
  echo "Prompt file not found: $PROMPT" >&2
  exit 1
fi

export CODEX_HOME="$ROOT/.codex"
mkdir -p "$CODEX_HOME"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI not found in PATH." >&2
  exit 1
fi

codex exec --full-auto --cd "$ROOT" - < "$PROMPT" > "$REPORT"

echo "Wrote report: $REPORT"
