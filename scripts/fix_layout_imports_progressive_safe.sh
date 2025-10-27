#!/usr/bin/env bash
set -euo pipefail

LAY="apps/web/src/app/layout.tsx"
MOD="apps/web/src/lib/net/fetchInstrument.tsx"

if [ ! -f "$LAY" ]; then
  echo "✗ Nicht gefunden: $LAY" >&2
  exit 1
fi
if [ ! -f "$MOD" ]; then
  echo "✗ Nicht gefunden: $MOD  (wurde add_progressive_ui.sh erfolgreich ausgeführt?)" >&2
  exit 1
fi

cp "$LAY" "$LAY.bak.$(date +%s)"

# 1) Fehlende Importe ergänzen (idempotent)
need_import_fetch=true
need_import_hud=true
grep -q 'import FetchInstrument ' "$LAY" && need_import_fetch=false
grep -q 'import PipelineHUD '     "$LAY" && need_import_hud=false

if $need_import_fetch || $need_import_hud; then
  tmp="$(mktemp)"
  {
    # vorhandene Datei kopieren
    cat "$LAY" > "$tmp"
  } >/dev/null

  # Einfügen der Imports ganz oben ist robust und unkritisch
  {
    echo "// --- progressive-ui auto-imports (safe) ---"
    $need_import_fetch && echo 'import FetchInstrument from "@/lib/net/fetchInstrument";'
    $need_import_hud   && echo 'import PipelineHUD from "@/ui/PipelineHUD";'
    echo "// --- end progressive-ui auto-imports ---"
    cat "$tmp"
  } > "$LAY"

  rm -f "$tmp"
fi

# 2) Wrapper in <body> nur einfügen, wenn fehlt
if ! grep -q '<FetchInstrument>' "$LAY"; then
  # nach dem öffnenden <body ...> einfügen
  perl -0777 -i -pe 's#(<body[^>]*>)#$1\n      <FetchInstrument>\n        <PipelineHUD />#s unless /<FetchInstrument>/;' "$LAY"
fi
if ! grep -q '</FetchInstrument>' "$LAY"; then
  perl -0777 -i -pe 's#(</body>)#      </FetchInstrument>\n$1#s unless /<\/FetchInstrument>/;' "$LAY"
fi

echo "✓ layout.tsx gepatcht. Backup: $(ls -1t apps/web/src/app/layout.tsx.bak.* 2>/dev/null | head -n1 || echo '-')"
echo "→ Bitte dev neu starten: pnpm -F @vog/web dev"
