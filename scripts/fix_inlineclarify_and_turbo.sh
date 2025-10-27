#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
APP_WEB="$ROOT/apps/web"
UI_FILE="$APP_WEB/src/ui/InlineClarify.tsx"
PKG_JSON="$ROOT/package.json"
TURBO_JSON="$ROOT/turbo.json"

echo "▶ Repo: $ROOT"

# 1) InlineClarify robust machen (default + named export, onSubmit|onResolve)
mkdir -p "$(dirname "$UI_FILE")"
cat > "$UI_FILE" <<'TSX'
"use client";
import { useState } from "react";

type MissingKey = "zeitraum"|"zuständigkeit"|"ort";
type Props = {
  missing: MissingKey | null;
  onResolve?: (k: MissingKey, val: any) => void;
  onSubmit?: (k: MissingKey, val: any) => void; // alias für Alt-Code
};

function InlineClarifyImpl({ missing, onResolve, onSubmit }: Props){
  const cb = onResolve ?? onSubmit ?? (()=>{});
  const [val, setVal] = useState("");
  if(!missing) return null;
  const label = missing === "zeitraum" ? "Zeitraum wählen (z. B. 2020–2024)" : missing === "zuständigkeit" ? "Ebene wählen" : "Ort";
  return (
    <div className="rounded-xl border p-3 text-sm">
      <div className="mb-2 font-medium">Uns fehlt: {label}</div>
      {missing==="zuständigkeit" ? (
        <div className="flex gap-2">
          {(["EU","Bund","Land","Kommune","Unsicher"] as const).map(l=>(
            <button key={l} className="rounded-lg border px-2 py-1" onClick={()=>cb("zuständigkeit", l)}>{l}</button>
          ))}
        </div>
      ) : (
        <input
          className="w-full rounded-lg border px-2 py-1"
          placeholder={label}
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") cb(missing, val); }}
        />
      )}
      <button className="mt-2 text-xs underline" onClick={()=>cb(missing, "Sonstiges")}>Sonstiges</button>
    </div>
  );
}

const InlineClarify = InlineClarifyImpl;
export { InlineClarify };     // named export
export default InlineClarify; // default export
TSX
echo "✓ InlineClarify.tsx geschrieben (default+named export, onSubmit alias)."

# 2) turbo.json säubern (globalEnv raus) – und lokal turbo pinnen
if [ -f "$TURBO_JSON" ]; then
  node - <<'NODE'
const fs = require('fs');
const p = process.env.TURBO_JSON;
try{
  const j = JSON.parse(fs.readFileSync(p,'utf8'));
  if (j.globalEnv) { delete j.globalEnv; }
  fs.writeFileSync(p, JSON.stringify(j, null, 2));
  console.log("✓ turbo.json: globalEnv entfernt");
}catch(e){ console.log("⚠ turbo.json nicht lesbar – übersprungen"); }
NODE
else
  echo "⚠ turbo.json nicht gefunden – übersprungen"
fi

# 3) package.json: turbo als devDependency sichern (lokal, damit Vercel nicht global nutzt)
node - <<'NODE'
const fs = require('fs');
const p = process.env.PKG_JSON;
const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies.turbo) pkg.devDependencies.turbo = "2.5.10";
fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
console.log("✓ package.json: turbo@2.5.10 als devDependency");
NODE

# 4) Install & schneller Check
if command -v pnpm >/dev/null 2>&1; then
  echo "▶ pnpm install (monorepo)"
  pnpm install --prefer-offline
  # Build nur für web; falls der Filtername anders ist, versuche beide Varianten
  echo "▶ Build apps/web"
  pnpm --filter @app/web run build || pnpm --filter ./apps/web run build || true
else
  echo "⚠ pnpm nicht gefunden – bitte lokal installieren."
fi

echo "✅ Hotfix fertig. Falls Vercel weiter globales turbo nutzt, ist durch devDependency ein lokales verfügbar."
