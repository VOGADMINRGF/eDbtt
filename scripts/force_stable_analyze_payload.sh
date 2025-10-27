# scripts/force_stable_analyze_payload.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"

backup() { [ -f "$1" ] && cp "$1" "$1.bak.$(date +%s)"; }

echo "→ Patch: $ROUTE"
backup "$ROUTE"
cat > "$ROUTE" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as analyzeMulti } from "@/features/ai/orchestrator_contrib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// weicher Usage-Logger (kein Crash)
async function recordUsageSafe(e:any){
  try{
    const m = await import("@/lib/metrics/usage");
    if (typeof (m as any).recordUsage === "function") await (m as any).recordUsage(e);
  }catch{}
}

// garantiert _meta/claims – egal was rauskommt
function forceStable(out:any, ms:number, note?:string){
  const fallback = {
    _meta: { mode: "error", errors: note ? [note] : [], tookMs: ms },
    claims: []
  };
  if (!out || typeof out !== "object") return fallback;
  if (!("_meta" in out)) {
    return { ...fallback, result: out };
  }
  if (!("claims" in out)) {
    return { ...out, claims: [] };
  }
  return out;
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  let ok = false, err: string|null = null;
  let model: string|null = null, totalTokens: number|null = null;
  let out: any = null;

  try{
    const u = new URL(req.url);
    const mode  = u.searchParams.get("mode") || process.env.VOG_ANALYZE_MODE || "gpt";
    const body  = await req.json().catch(()=> ({}));
    const text  = String(body?.text ?? "").trim().slice(0, 8000);
    const maxClaims = Number(body?.maxClaims ?? 3);

    if (!text) {
      const ms = Date.now()-t0;
      const payload = forceStable(null, ms, "no-text");
      ok = true;
      return NextResponse.json(payload, { status: 200 });
    }

    out = mode === "multi"
      ? await analyzeMulti(text, { maxClaims })
      : await analyzeContribution(text, { maxClaims });

    model       = (out?._meta?.model ?? process.env.OPENAI_MODEL ?? null) as any;
    totalTokens = (out?._meta?.usage?.total_tokens ?? null) as any;
    ok = true;

    const ms = Date.now()-t0;
    const payload = forceStable(out, ms);
    return NextResponse.json(payload, { status: 200 });

  }catch(e:any){
    err = String(e?.message || e);
    const ms = Date.now()-t0;
    const payload = forceStable(null, ms, err);
    return NextResponse.json(payload, { status: 200 });

  }finally{
    await recordUsageSafe({
      ts: Date.now(),
      route: "/api/contributions/analyze",
      userId: null,
      model, totalTokens,
      ms: Date.now()-t0, ok, err,
      meta: { source: "force-stable" }
    });
  }
}
TS
echo "✓ Analyze-Route gehärtet"
