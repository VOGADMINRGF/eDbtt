#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP_WEB="$ROOT/apps/web"

echo "→ Root: $ROOT"
echo "→ Installiere Tailwind v4 & PostCSS-Plugin (workspace)…"
pnpm add -D -w tailwindcss@^4 @tailwindcss/postcss @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio

echo "→ Schreibe apps/web/postcss.config.cjs (nur @tailwindcss/postcss)…"
cat > "$APP_WEB/postcss.config.cjs" <<'CJS'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
CJS

echo "→ Entferne ggf. alte PostCSS-Configs, die Tailwind direkt einbinden…"
rm -f "$APP_WEB/postcss.config.js" 2>/dev/null || true
rm -f "$APP_WEB/postcss.config.mjs" 2>/dev/null || true
# (Nur apps/web anfassen – andere Pakete lassen wir in Ruhe)

echo "→ Prüfe Tailwind Config…"
if [ ! -f "$APP_WEB/tailwind.config.ts" ] && [ -f "$APP_WEB/tailwind.config.cjs" ]; then
  echo "   - Warnung: tailwind.config.cjs gefunden. In v4 ist .ts/ESM empfohlen."
fi

echo "→ Optional: Cache säubern (safe)…"
rm -rf "$APP_WEB/.next" 2>/dev/null || true

echo "→ Fertig. Bitte dev neu starten: pnpm --filter @vog/web dev"
