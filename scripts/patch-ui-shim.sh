#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
SRC="$APP/src"

# 1) ui.ts -> ui.tsx
if [ -f "$SRC/shims/ui.ts" ]; then
  git mv -f "$SRC/shims/ui.ts" "$SRC/shims/ui.tsx" 2>/dev/null || mv "$SRC/shims/ui.ts" "$SRC/shims/ui.tsx"
  echo "Renamed: src/shims/ui.ts -> src/shims/ui.tsx"
fi

# 2) tsconfig paths @ui auf .tsx umstellen
node - <<'NODE'
const fs = require('fs');
const p = 'apps/web/tsconfig.json';
const j = JSON.parse(fs.readFileSync(p,'utf8'));
j.compilerOptions ??= {};
j.compilerOptions.paths ??= {};
const paths = j.compilerOptions.paths;

if (paths['@ui']) {
  paths['@ui'] = paths['@ui'].map(x => x === 'src/shims/ui.ts' ? 'src/shims/ui.tsx' : x);
} else {
  paths['@ui'] = ['src/shims/ui.tsx'];
}

fs.writeFileSync(p, JSON.stringify(j, null, 2));
console.log('tsconfig.json patched: "@ui" -> src/shims/ui.tsx');
NODE

echo "Done."
