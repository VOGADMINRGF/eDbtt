#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
APP_WEB="$ROOT/apps/web"
UI_FILE="$APP_WEB/src/ui/InlineClarify.tsx"
PKG_JSON="$ROOT/package.json"
TURBO_JSON="$ROOT/turbo.json"

echo "▶ Repo: $ROOT"

# 0) Sanity
test -f "$PKG_JSON" || { echo "❌ package.json nicht gefunden: $PKG_JSON"; exit 1; }

# 1) InlineClarify (robust: default+named export, onSubmit alias)
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
echo "✓ InlineClarify.tsx ok (default+named, onSubmit alias)."

# 2) turbo.json patchen (falls vorhanden): globalEnv entfernen
if [ -f "$TURBO_JSON" ]; then
  node - "$TURBO_JSON" <<'NODE'
const fs = require('fs');
const p = process.argv[2];
try{
  const j = JSON.parse(fs.readFileSync(p,'utf8'));
  if (j.globalEnv) { delete j.globalEnv; }
  fs.writeFileSync(p, JSON.stringify(j, null, 2));
  console.log("✓ turbo.json: globalEnv entfernt");
}catch(e){
  console.log("⚠ turbo.json konnte nicht gelesen/geschrieben werden:", e.message);
}
NODE
else
  echo "ℹ︎ turbo.json nicht gefunden – Schritt übersprungen."
fi

# 3) package.json: turbo@2.5.10 als devDependency (idempotent)
node - "$PKG_JSON" <<'NODE'
const fs = require('fs');
const p = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies.turbo) pkg.devDependencies.turbo = "2.5.10";
fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
console.log("✓ package.json: turbo@2.5.10 als devDependency gesetzt (oder war schon da).");
NODE

# 4) Install & (optional) Build
if command -v pnpm >/dev/null 2>&1; then
  echo "▶ pnpm install"
  pnpm install --prefer-offline
  echo "▶ (Optional) Build apps/web"
  pnpm --filter @app/web run build || pnpm --filter ./apps/web run build || true
else
  echo "⚠ pnpm nicht gefunden – Install übersprungen."
fi

echo "✅ Fertig. Jetzt dev neu starten bzw. commit & push ausführen."
