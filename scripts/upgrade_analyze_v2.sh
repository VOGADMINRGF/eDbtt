#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
WEB="$ROOT/apps/web"
FEAT="$WEB/src/features"
AI="$FEAT/ai"
PROMPTS="$AI/prompts"
ROLES="$AI/roles"
ANALYZE="$FEAT/analyze"

test -f "$ROOT/package.json" || { echo "❌ package.json fehlt"; exit 1; }

mkdir -p "$PROMPTS" "$ROLES" "$ANALYZE" "$WEB/src/app/api/analyze/stream"

# 1) Prompt für Extractor (mehrere Kandidaten)
cat > "$PROMPTS/extractor.ts" <<'TS'
export const EXTRACTOR_SYSTEM = `Split the input into up to 8 ATOMIC, one-sentence policy statements in German (B1/B2). No duplication. No meta talk. Output strict JSON array.`;
export const EXTRACTOR_USER = ({input}:{input:string})=> `INPUT:
${input}

Return JSON: string[]  // each item is ONE sentence (policy-relevant)`;
TS

# 2) Role: Extractor
cat > "$ROLES/extractor.ts" <<'TS'
import { runLLMJson } from "../providers";
import { EXTRACTOR_SYSTEM, EXTRACTOR_USER } from "../prompts/extractor";

export async function extractCandidates(input: string, opts?:{timeoutMs?:number, model?:string}): Promise<string[]>{
  const { data } = await runLLMJson({
    system: EXTRACTOR_SYSTEM,
    user: EXTRACTOR_USER({ input }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1400,
  });
  return Array.isArray(data) ? (data as string[]).slice(0,8) : [];
}
TS

# 3) Multi-Orchestrator (Statements[])
cat > "$AI/orchestrator_many.ts" <<'TS'
import { extractCandidates } from "./roles/extractor";
import { orchestrateClaim } from "./orchestrator_claims";

export type OrchestratedMany = {
  statements: Awaited<ReturnType<typeof orchestrateClaim>>[];
  meta: { total:number; tookMs:number };
};

export async function orchestrateMany(input: string): Promise<OrchestratedMany>{
  const t0 = Date.now();
  const cand = await extractCandidates(input).catch(()=>[]);
  const targets = (cand.length ? cand : [input]).slice(0,8);
  const results = await Promise.all(
    targets.map(txt => orchestrateClaim(txt).catch(e => ({ error:String(e), claim:{ text:txt, readability:"B1" } as any })))
  );
  return { statements: results as any, meta: { total: results.length, tookMs: Date.now()-t0 } };
}
TS

# 4) SSE-Route: /api/analyze/stream (Chat-Gefühl mit Progress)
cat > "$WEB/src/app/api/analyze/stream/route.ts" <<'TS'
import { NextRequest } from "next/server";
import { orchestrateMany } from "@/src/features/ai/orchestrator_many";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text")||"").trim();
  const enc = new TextEncoder();

  return new Response(new ReadableStream({
    async start(controller){
      const send = (event:string, data:any)=>
        controller.enqueue(enc.encode(`event:${event}\ndata:${JSON.stringify(data)}\n\n`));
      try{
        if(!text){ send("error",{msg:"Kein Text übergeben."}); controller.close(); return; }
        send("status",{step:"extract", msg:"Extrahiere Statements…"});
        const res = await orchestrateMany(text);
        send("status",{step:"compose", msg:"Bewerte & ergänze…"});
        send("result", res);
      }catch(e:any){
        send("error",{msg:String(e?.message||e)});
      }finally{
        controller.close();
      }
    }
  }), {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store" }
  });
}
TS

# 5) Analyze-API erweitern: MODE=orchestrated-many liefert statements[]
API="$WEB/src/app/api/contributions/analyze/route.ts"
if test -f "$API"; then
  if ! grep -q 'orchestrateMany' "$API"; then
    sed -i.bak '1s;^;import { orchestrateMany } from "@/src/features/ai/orchestrator_many";\n;' "$API"
  fi
  # Nach MODE-Zeile einen zweiten Zweig einfügen (idempotent)
  if ! grep -q 'stage:"orchestrated-many"' "$API"; then
    awk '
      /VOG_ANALYZE_MODE/ && !p {
        print;
        print "  if (MODE === \"orchestrated-many\" || req.nextUrl.searchParams.get(\"multi\") === \"1\") {";
        print "    const out = await orchestrateMany(text);";
        print "    return NextResponse.json({ ok:true, stage:\"orchestrated-many\", ...out }, { status:200, headers:{\"cache-control\":\"no-store\"} });";
        print "  }";
        p=1; next
      }1
    ' "$API" > "$API.tmp" && mv "$API.tmp" "$API"
  fi
else
  echo "⚠️  API-Route nicht gefunden: $API (übersprungen)"
fi

# 6) UI: simple Labels-Datei (für „Statement“ statt „Claim“)
mkdir -p "$WEB/src/lib"
cat > "$WEB/src/lib/labels.ts" <<'TS'
export const LABELS = {
  item: "Statement",
  items: "Statements",
  analyzing: "Analysiere…",
  suggestedEvidence: "Belege (Vorschläge – prüfen)",
  perspectives: "Perspektiven",
  score: "Redaktions-Score",
};
TS

echo "▶ Install + kurzer Type-Check"
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --prefer-offline || true
  pnpm --filter @app/web exec tsc --noEmit || true
fi

echo "✅ Upgrade fertig:"
echo "   • /api/analyze/stream (SSE)"
echo "   • MODE=orchestrated-many oder ?multi=1 → statements[]"
echo "   • Extractor (max 8) → kein 1-Claim-Problem mehr"
