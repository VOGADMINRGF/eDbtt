#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
WEB="$ROOT/apps/web"

# ---------- A) bson -> mongodb (robust über Node) ----------
if [ -f "$WEB/src/server/drafts.ts" ]; then
  FILE="$WEB/src/server/drafts.ts" node <<'NODE'
const fs = require('fs');
const p  = process.env.FILE;
try {
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/from\s*['"]bson['"]/g, 'from "mongodb"');
  fs.writeFileSync(p, s);
  console.log("patched:", p);
} catch (e) {
  console.error("skip drafts.ts patch:", e.message);
}
NODE
fi

# ---------- B) allowedDevOrigins inkl. LAN-IP ----------
# macOS: en0 (WLAN), en1 (Ethernet) – sonst leer
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")"
ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
if [ -n "$LAN_IP" ]; then
  ORIGINS="$ORIGINS,http://$LAN_IP:3000"
fi

mkdir -p "$WEB"
cat > "$WEB/next.config.ts" <<TS
import type { NextConfig } from "next";
const origins = "${ORIGINS}".split(",");
const config: NextConfig = {
  experimental: { allowedDevOrigins: origins, typedRoutes: true, externalDir: true }
};
export default config;
TS

# ---------- C) Typecheck & Dev ----------
pnpm --filter @vog/web run typecheck
pnpm --filter @vog/web run dev
