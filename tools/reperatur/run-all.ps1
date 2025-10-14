param()

$ErrorActionPreference = "Continue"
if (-not (Test-Path "tools/reperatur/reports")) { New-Item -ItemType Directory -Path "tools/reperatur/reports" | Out-Null }

Write-Host "== Reperatur: Codemods (Dry-Run unless REPERATUR_WRITE=1) =="
node tools/reperatur/10-trimongo.mjs
node tools/reperatur/11-imports-prisma.mjs
node tools/reperatur/12-next-dynamic.mjs
node tools/reperatur/13-redis-upstash.mjs
node tools/reperatur/14-mongoose-indexes.mjs
node tools/reperatur/15-paths-tsconfig.mjs

Write-Host "== ESLint --fix (optional) =="
pnpm -w exec eslint . --ext .ts,.tsx --fix

Write-Host "== Typecheck =="
pnpm -w exec tsc --noEmit -b
