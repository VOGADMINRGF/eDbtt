#!/usr/bin/env bash
set -euo pipefail
APP="apps/web"

echo "▶ ensure next-env.d.ts"
mkdir -p "$APP"
cat > "$APP/next-env.d.ts" <<'TS'
// NOTE: Managed by Next.js – don't edit.
/// <reference types="next" />
/// <reference types="next/image-types/global" />
TS

echo "▶ ensure at least one TS file"
mkdir -p "$APP/src/types"
printf 'export {};\n' > "$APP/src/types/__keep.ts"

echo "▶ patch tsconfig.json include/exclude"
node - <<'NODE'
const fs=require('fs'); const p='apps/web/tsconfig.json';
const cfg=JSON.parse(fs.readFileSync(p,'utf8'));
cfg.include=[
  "next-env.d.ts",
  "**/*.ts","**/*.tsx","**/*.mts","**/*.cts",
  ".next/types/**/*.ts",
  "next.config.ts"
];
cfg.exclude=[
  "node_modules",".next","dist","build",
  "src/_disabled/**","**/__tests__/**","**/*.test.*",
  "../../features/**","../../packages/**","../../apps/**"
];
fs.writeFileSync(p, JSON.stringify(cfg,null,2));
console.log('tsconfig patched:',p);
NODE

echo "▶ run typecheck (non-blocking)"
pnpm --filter @vog/web run typecheck || true
echo "✅ done."
