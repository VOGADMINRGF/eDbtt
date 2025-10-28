#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
FILE_TS="$ROOT/apps/web/src/lib/net/fetchInstrument.ts"
FILE_TSX="$ROOT/apps/web/src/lib/net/fetchInstrument.tsx"

if [ -f "$FILE_TS" ]; then
  mv "$FILE_TS" "$FILE_TSX"
  echo "→ umbenannt: fetchInstrument.ts → fetchInstrument.tsx"
fi

mkdir -p "$(dirname "$FILE_TSX")"
cat > "$FILE_TSX" <<'TSX'
import type { ReactNode } from "react";

export default function FetchInstrument({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
TSX
echo "✓ geschrieben: $FILE_TSX"

# kurzer Type-Check
if command -v pnpm >/dev/null 2>&1; then
  pnpm --filter @vog/web exec tsc --noEmit || true
fi

echo "✅ fertig."
