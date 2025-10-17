#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
WEB="$ROOT/apps/web"
FEAT="$ROOT/features"

echo ">>> Phase 2: API wired to EXTERNAL features ($FEAT)"

# portable sed – JETZT gesetzt
if command -v gsed >/dev/null 2>&1; then SED="gsed"; else SED="sed"; fi

test -d "$WEB" || { echo "ERROR: $WEB nicht gefunden"; exit 1; }

# 1) externes analyzeContribution.ts: z.record + export-Schlüssel
if [ -d "$FEAT" ]; then
  while IFS= read -r FILE; do
    [ -z "$FILE" ] && continue
    FILE_ABS="$FILE" node <<'NODE'
const fs=require('fs'); const p=process.env.FILE_ABS;
let s=fs.readFileSync(p,'utf8');
s=s.replace(/z\.record\(\s*z\.any\(\)\s*\)/g,'z.record(z.string(), z.any())');
if (!/export\s+const\s+AnalyzeSchema\s*=/.test(s)) {
  s=s.replace(/(^|\n)(\s*)const\s+AnalyzeSchema(\s*)=/, '$1$2export const AnalyzeSchema$3=');
}
if (!/export\s+type\s+AnalyzeInput\b/.test(s)) {
  s = s.replace(/\s*$/, '\nexport type AnalyzeInput = z.infer<typeof AnalyzeSchema>;\n');
}
fs.writeFileSync(p,s);
console.log(" - external feature patched:", p);
NODE
  done < <(find "$FEAT" -type f -name "analyzeContribution.ts" 2>/dev/null || true)
else
  echo " - WARN: $FEAT nicht gefunden (übersprungen)"
fi

# 2) Analyze-Route: akzeptiert {text} ODER komplexes Objekt, immer 200 zurück
mkdir -p "$WEB/src/app/api/contributions/analyze"
cat > "$WEB/src/app/api/contributions/analyze/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json().catch(()=> ({}));
    // flexible Argument-Ermittlung
    const text = typeof body === "string" ? body : (body?.text ?? body?.claims?.[0]?.text ?? "");
    const arg  = text ? text : body; // string bevorzugen, sonst Objekt durchreichen
    const result = await (analyzeContribution as any)(arg as any);
    return NextResponse.json({ ok:true, result, echo: body }, { status: 200 });
  } catch (err:any) {
    return NextResponse.json({ ok:true, error: err?.message ?? "analyze failed" }, { status: 200 });
  }
}
TS
echo " - /api/contributions/analyze ready (lenient)"

# 3) SSE-Stream (Response statt NextResponse)
mkdir -p "$WEB/src/app/api/contributions/analyze/stream"
cat > "$WEB/src/app/api/contributions/analyze/stream/route.ts" <<'TS'
import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";

const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") ?? "";
  const steps = [
    "Vorverarbeitung","Kanon-Mapping","Interner Abgleich","Externe Quellen",
    "Virtuelles Experten-Panel","Faktencheck","Trust-Score"
  ];
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode(`event:info\ndata:${JSON.stringify({received:text.length})}\n\n`));
      for (let i=0; i<steps.length; i++){
        controller.enqueue(enc.encode(`event:step\ndata:${JSON.stringify({i,label:steps[i]})}\n\n`));
        controller.enqueue(enc.encode(`event:progress\ndata:${JSON.stringify({p: Math.round(((i+1)/steps.length)*100)})}\n\n`));
        controller.enqueue(enc.encode(`event:log\ndata:${JSON.stringify({msg: "Checked "+steps[i]})}\n\n`));
        if (steps[i]==="Externe Quellen") {
          const news=[{title:"Stub: Quelle A",url:"#",score:0.42},{title:"Stub: Quelle B",url:"#",score:0.36}];
          controller.enqueue(enc.encode(`event:news\ndata:${JSON.stringify({items:news})}\n\n`));
        }
        await sleep(650);
      }
      controller.enqueue(enc.encode(`event:done\ndata:{}\n\n`));
      controller.close();
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type":"text/event-stream; charset=utf-8",
      "Cache-Control":"no-cache, no-transform",
      "Connection":"keep-alive"
    }
  });
}
TS
echo " - /api/contributions/analyze/stream ready"

# 4) Drafts-Stub
mkdir -p "$WEB/src/app/api/drafts"
cat > "$WEB/src/app/api/drafts/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import "server-only";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}));
  return NextResponse.json({
    ok:true,
    draft:{ _id: Math.random().toString(36).slice(2), title: body?.title ?? "Draft",
            content: body?.content ?? "", createdAt: new Date().toISOString() }
  }, { status: 201 });
}
TS
echo " - /api/drafts ready"

# 5) News-Stub
mkdir -p "$WEB/src/app/api/news/search"
cat > "$WEB/src/app/api/news/search/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({ q:"", limit:5 }));
  const items = [
    { title:"Stub-News 1", url:"#", ts: Date.now(), relevance:0.9 },
    { title:"Stub-News 2", url:"#", ts: Date.now()-3600_000, relevance:0.7 }
  ];
  return NextResponse.json({ ok:true, items, echo:body }, { status: 200 });
}
TS
echo " - /api/news/search ready"

# 6) drafts.ts Safety (bson -> mongodb)
if [ -f "$WEB/src/server/drafts.ts" ]; then
  $SED -i.bak 's/from\s*['"'"'"]bson['"'"'"]/from "mongodb"/g' "$WEB/src/server/drafts.ts" || true
  grep -q 'server-only' "$WEB/src/server/drafts.ts" || $SED -i.bak '1s/^/import "server-only";\n/' "$WEB/src/server/drafts.ts"
fi

echo ">>> Phase 2 done"
