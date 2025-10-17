#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
WEB="$ROOT/apps/web"

fix_page () {
  local P="$1"
  if [ -f "$P" ]; then
    cp "$P" "$P.bak.ssr"  # Backup
    cat > "$P" <<'TSX'
import AnalyzeUI from "@/components/analyze/AnalyzeUI";
export default function Page(){ return <AnalyzeUI />; }
TSX
    echo "fixed: $P"
  else
    echo "skip (not found): $P"
  fi
}

fix_page "$WEB/src/app/contributions/analyze/page.tsx"
fix_page "$WEB/src/app/contributions/new/page.tsx"

echo "running typecheck…"
pnpm --filter @vog/web run typecheck || true

# Dev nur starten, wenn Port 3000 noch frei ist
if lsof -i:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Dev-Server läuft bereits auf :3000 – bitte Browser neu laden."
else
  pnpm --filter @vog/web run dev
fi
