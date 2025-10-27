# im Repo-Root
cat > scripts/fix_features_aliases_and_shims.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
APP="$ROOT/apps/web"
SRC="$APP/src"

echo "→ Root: $ROOT"

mkdir -p "$SRC/shims/features/analyze" \
         "$SRC/shims/features/ai" \
         "$SRC/shims/features/search" \
         "$SRC/shims/features/analysis"

########################################
# A) tsconfig Aliases sauber mergen
########################################
BASE="$ROOT/tsconfig.base.json"
WEB="$APP/tsconfig.json"

node - "$BASE" <<'NODE'
const fs=require('fs');
const file=process.argv[2];
const j=JSON.parse(fs.readFileSync(file,'utf8'));
j.compilerOptions=j.compilerOptions||{};
j.compilerOptions.baseUrl=j.compilerOptions.baseUrl||'.';
j.compilerOptions.paths=j.compilerOptions.paths||{};
if(!j.compilerOptions.paths['@features/*']) j.compilerOptions.paths['@features/*']=['features/*'];
fs.writeFileSync(file,JSON.stringify(j,null,2));
console.log('  ✓ updated', file);
NODE

node - "$WEB" <<'NODE'
const fs=require('fs');
const file=process.argv[2];
const j=JSON.parse(fs.readFileSync(file,'utf8'));
j.compilerOptions=j.compilerOptions||{};
j.compilerOptions.paths=j.compilerOptions.paths||{};
if(!j.compilerOptions.paths['@features/*']) j.compilerOptions.paths['@features/*']=['../../features/*'];
// map "@/features/*" (src-root alias) auf unsere Shims
j.compilerOptions.paths['@/features/*']=['./src/shims/features/*'];
fs.writeFileSync(file,JSON.stringify(j,null,2));
console.log('  ✓ updated', file);
NODE

########################################
# B) Shims schreiben (re-export auf zentralen /features-Baum)
########################################
# analyze/analyzeContribution
cat > "$SRC/shims/features/analyze/analyzeContribution.ts" <<'TS'
export * from "@features/analyze/analyzeContribution";
TS
echo "  • shim: analyze/analyzeContribution"

# analyze/clarify
cat > "$SRC/shims/features/analyze/clarify.ts" <<'TS'
export * from "@features/analyze/clarify";
TS
echo "  • shim: analyze/clarify"

# ai/orchestrator_contrib
cat > "$SRC/shims/features/ai/orchestrator_contrib.ts" <<'TS'
export * from "@features/ai/orchestrator_contrib";
TS
echo "  • shim: ai/orchestrator_contrib"

# search/civic
cat > "$SRC/shims/features/search/civic.ts" <<'TS'
export * from "@features/search/civic";
TS
echo "  • shim: search/civic"

# analysis/extract (historischer Importpfad)
cat > "$SRC/shims/features/analysis/extract.ts" <<'TS'
export { analyzeContribution } from "@features/analyze/analyzeContribution";
export type { AnalyzeResult, Claim } from "@features/analyze/analyzeContribution";
TS
echo "  • shim: analysis/extract"

########################################
# C) Fallback für /features/analyze/clarify.ts (nur anlegen, wenn fehlt)
########################################
CLARIF
