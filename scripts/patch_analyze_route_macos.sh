#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
API="${1:-$ROOT/apps/web/src/app/api/contributions/analyze/route.ts}"

[ -f "$API" ] || { echo "❌ nicht gefunden: $API"; exit 1; }

node - <<'NODE' "$API"
const fs=require('fs');
const p=process.argv[2];
let s=fs.readFileSync(p,'utf8');

const importLine='import { orchestrateMany } from "@/src/features/ai/orchestrator_many";';
if(!s.includes('orchestrateMany')){
  // import an den Dateianfang setzen (nach evtl. 'use server' Zeile)
  s = s.replace(/^((?:'use server'|"use server");?\s*)?/,
    (_m,us)=> (us||'') + importLine + "\n");
}

if(!s.includes('stage:"orchestrated-many"')){
  // nach MODE-Zeile einfügen
  const modeRe = /const\s+MODE\s*=.*?;\s*/s;
  if(modeRe.test(s)){
    s = s.replace(modeRe, m =>
      m +
`  if (MODE === "orchestrated-many" || req.nextUrl.searchParams.get("multi") === "1") {
    const out = await orchestrateMany(text);
    return NextResponse.json({ ok:true, stage:"orchestrated-many", ...out }, { status:200, headers:{ "cache-control":"no-store" } });
  }
`);
  } else {
    console.error("⚠ MODE-Zeile nicht gefunden – bitte manuell prüfen.");
  }
}

fs.writeFileSync(p,s);
console.log("✓ Analyze-Route gepatcht:", p);
NODE

echo "✅ Fertig."

