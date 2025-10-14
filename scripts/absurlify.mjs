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
