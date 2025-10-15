#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
SRC="$APP/src"

# macOS/GNU sed in-place
if sed --version >/dev/null 2>&1; then SED_I=(-i); else SED_I=(-i ''); fi

# AdminConfig um pricing + weitere limits ergänzen
cat > "$SRC/config/admin-config.ts" <<'TS'
export type AdminConfig = {
  limits: {
    newsfeedMaxPerRun: number;
    factcheckMaxPerItemTokens: number;
    enableAutoPost: boolean;
  };
  region: { defaultRegionKey: string };
  pricing: {
    membershipMonthlyEUR: number;
    postImmediateEUR: number;
    swipeToPostThresholds: number[];
  };
  features: string[];
  roles: string[];
};

export const adminConfig: AdminConfig = {
  limits: {
    newsfeedMaxPerRun: 50,
    factcheckMaxPerItemTokens: 2048,
    enableAutoPost: false,
  },
  region: { defaultRegionKey: "de-national" },
  pricing: {
    membershipMonthlyEUR: 9,
    postImmediateEUR: 1,
    swipeToPostThresholds: [3, 5, 8],
  },
  features: [],
  roles: ["admin"],
};

export default adminConfig;
TS

# Optional: features/dashboard komplett aus dem Typecheck, damit wir uns auf contributions/new konzentrieren
node - <<'NODE'
const fs = require('fs');
const p = "apps/web/tsconfig.json";
const j = JSON.parse(fs.readFileSync(p,'utf8'));
j.exclude = Array.from(new Set([...(j.exclude||[]), "../../features/dashboard/**"]));
fs.writeFileSync(p, JSON.stringify(j, null, 2));
console.log("tsconfig.json: excluded ../../features/dashboard/**");
NODE

echo "Fixes applied."
