#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
APP_DIR="apps/web"
SRC_DIR="$APP_DIR/src"
UTIL_DIR="$SRC_DIR/utils"

mkdir -p "$UTIL_DIR" "$SRC_DIR/app/reports" "$SRC_DIR/app/contributions" scripts

# 1) Helper (absUrl) – Server-safe
cat > "$UTIL_DIR/serverBaseUrl.ts" <<'TS'
import { headers } from "next/headers";

/** Basis-URL für Server Components (ohne Slash am Ende). */
export function serverBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host  = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

/** Aus "/api/foo" wird "http(s)://host/api/foo". */
export function absUrl(path: string): string {
  const base = serverBaseUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
TS

# 2) Seiten sicher überschreiben (verwenden absUrl)
cat > "$SRC_DIR/app/reports/page.tsx" <<'TS'
import "server-only";
import { absUrl } from "@/utils/serverBaseUrl";

async function getReports() {
  const r = await fetch(absUrl("/api/reports"), { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function ReportsPage() {
  const list = await getReports();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {list.map((r: any) => (
          <div key={r.id} className="border rounded p-4">
            <div className="font-semibold">{r.title}</div>
            <div className="text-xs text-gray-500">{new Date(r.updatedAt||r.createdAt).toLocaleString()}</div>
            <p className="text-sm mt-2 line-clamp-3">{r.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
TS

cat > "$SRC_DIR/app/contributions/page.tsx" <<'TS'
import "server-only";
import { absUrl } from "@/utils/serverBaseUrl";

async function getContribs() {
  const r = await fetch(absUrl("/api/contributions"), { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function ContributionsPage() {
  const items = await getContribs();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Beiträge</h1>
      <div className="space-y-3">
        {items.map((c: any) => (
          <div key={c.id} className="border rounded p-3 bg-white/60">
            <div className="font-semibold">{c.title || c.text?.slice(0,80)}</div>
            <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
            <p className="text-sm mt-2">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
TS

# 3) Auto-Fixer (Node) – patcht alle Server-Dateien
cat > scripts/absurlify.mjs <<'JS'
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || "apps/web/src";
const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const files = [];
(function walk(d){
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (EXT.has(path.extname(p))) files.push(p);
  }
})(ROOT);

// Skip API routes (die rufen selten eigene APIs) & Client Components
function isApiRoute(p){ return /\/app\/api\//.test(p); }
function isClientFile(src){
  const head = src.split(/\r?\n/).slice(0,5).join("\n");
  return /^['"]use client['"];?/m.test(head);
}

const rxFetchRel   = /fetch\s*\(\s*([`'"])\s*\/api\//g;       // fetch("/api...")
const rxNewUrlRel  = /new\s+URL\s*\(\s*([`'"])\s*\/api\//g;   // new URL("/api...")
const rxNewReqRel  = /new\s+Request\s*\(\s*([`'"])\s*\/api\//g;

let patched=0, imports=0, skippedClient=0, skippedApi=0, examined=0;

for (const f of files) {
  examined++;
  if (isApiRoute(f)) { skippedApi++; continue; }

  let src = fs.readFileSync(f, "utf8");
  if (isClientFile(src)) { skippedClient++; continue; }

  const had = rxFetchRel.test(src) || rxNewUrlRel.test(src) || rxNewReqRel.test(src);
  if (!had) continue;

  // Reset & replace
  src = src
    .replace(rxFetchRel,  (m,q)=>`fetch(absUrl(${q}/api/`)
    .replace(rxNewUrlRel, (m,q)=>`new URL(absUrl(${q}/api/`)
    .replace(rxNewReqRel, (m,q)=>`new Request(absUrl(${q}/api/`);

  if (!src.includes('from "@/utils/serverBaseUrl"')) {
    // Import nach eventueller 'use server' Direktive einfügen
    const lines = src.split(/\r?\n/);
    let i = 0;
    while (i < Math.min(4, lines.length) && /^['"]use (client|server)['"];?/.test(lines[i]?.trim()||"")) i++;
    lines.splice(i, 0, 'import { absUrl } from "@/utils/serverBaseUrl";');
    src = lines.join("\n");
    imports++;
  }

  fs.writeFileSync(f, src, "utf8");
  patched++;
  console.log("✓ patched", f);
}

console.log("— absurlify summary —");
console.log("examined:", examined);
console.log("patched :", patched);
console.log("imports :", imports);
console.log("skipped client files:", skippedClient);
console.log("skipped api routes  :", skippedApi);

// Rest-Treffer (Info)
const leftovers = [];
for (const f of files) {
  if (isApiRoute(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  if (isClientFile(s)) continue;
  if (/fetch\s*\(\s*([`'"])\s*\/api\//.test(s)) leftovers.push(f);
}
if (leftovers.length) {
  console.log("LEFTOVERS (relative fetch in server files):", leftovers.length);
  leftovers.slice(0,80).forEach(p=>console.log(" -", p));
} else {
  console.log("no leftover relative fetch() in server files.");
}
JS

node scripts/absurlify.mjs "$SRC_DIR"

echo "-----------------------------------------------------------"
echo "✔ Patchlauf beendet. Starte den Dev-Server neu: pnpm dev"
echo "Wenn die Zusammenfassung 'LEFTOVERS' ausgibt, poste die ersten 10 Pfade."
