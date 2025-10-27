# --- save as: scripts/fix_analyze_usage_bundle.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
USAGE_LIB="$ROOT/apps/web/src/lib/metrics/usage.ts"
ADMIN_ROUTE="$ROOT/apps/web/src/app/api/admin/usage/summary/route.ts"

ts_backup () {
  local f="$1"; [ -f "$f" ] || return 0
  cp "$f" "${f}.bak.$(date +%s)"
}

echo "→ Root: $ROOT"

# 1) Analyze-Route robust machen (Lazy-Import, kein Alias vor Imports)
ts_backup "$ROUTE"
cat > "$ROUTE" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { orchestrateContribution as step_analyze_multi_llm } from "@/features/ai/orchestrator_contrib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function recordUsageSafe(e: {
  ts: number;
  route: string;
  userId: string | null;
  model: string | null;
  totalTokens: number | null;
  ms: number;
  ok: boolean;
  err: string | null;
  meta?: Record<string, any>;
}) {
  try {
    const mod = await import("@/lib/metrics/usage");
    const fn = (mod as any)?.recordUsage;
    if (typeof fn === "function") await fn(e);
  } catch { /* noop */ }
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  let ok = false, err: string | null = null;
  let model: string | undefined;
  let totalTokens: number | undefined;
  let out: any = null;

  try {
    const url  = new URL(req.url);
    const mode = url.searchParams.get("mode") || (process.env.VOG_ANALYZE_MODE || "gpt");
    const body = await req.json().catch(() => ({}));
    const text = String((body as any)?.text ?? "").trim().slice(0, 8000);
    const maxClaims = Number((body as any)?.maxClaims ?? 3);

    if (!text) {
      ok = true;
      return NextResponse.json({ error: "Kein Text übergeben.", status: 400 }, { status: 200 });
    }

    out = mode === "multi"
      ? await step_analyze_multi_llm(text, { maxClaims })
      : await analyzeContribution(text, { maxClaims });

    model       = out?._meta?.model || process.env.OPENAI_MODEL || undefined;
    totalTokens = out?._meta?.usage?.total_tokens || undefined;
    ok = true;
    return NextResponse.json(out, { status: 200 });

  } catch (e: any) {
    err = String(e?.message || e);
    out = { _meta: { mode: "error", errors: [String(err)], tookMs: Date.now() - t0 } };
    return NextResponse.json(out, { status: 200 });

  } finally {
    await recordUsageSafe({
      ts: Date.now(),
      route: "/api/contributions/analyze",
      userId: null,
      model: model || null,
      totalTokens: totalTokens || null,
      ms: Date.now() - t0,
      ok,
      err: ok ? null : err,
      meta: { source: "wrapper" },
    });
  }
}
TS
echo "  ✓ route.ts gepatcht"

# 2) Fallback-Usage-Modul nur anlegen, wenn es nicht existiert
if [ ! -f "$USAGE_LIB" ]; then
  mkdir -p "$(dirname "$USAGE_LIB")"
  cat > "$USAGE_LIB" <<'TS'
/**
 * Fallback-Usage-Logger: macht per default nichts.
 * Lokal optional NDJSON nach .next/usage.ndjson schreiben, wenn VOG_USAGE_FILE gesetzt ist.
 */
import { appendFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";

export type UsageEvent = {
  ts: number;
  route: string;
  userId: string | null;
  model: string | null;
  totalTokens: number | null;
  ms: number;
  ok: boolean;
  err: string | null;
  meta?: Record<string, any>;
};

export async function recordUsage(e: UsageEvent): Promise<void> {
  try {
    const file = process.env.VOG_USAGE_FILE || "";
    if (!file) return; // no-op
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, JSON.stringify(e) + "\n", "utf8");
  } catch { /* no-op */ }
}
TS
  echo "  ✓ usage.ts (fallback) erzeugt"
else
  echo "  ↷ usage.ts existiert – unverändert gelassen"
fi

# 3) Einfacher Admin-Summary-Endpoint (liest NDJSON optional)
if [ ! -f "$ADMIN_ROUTE" ]; then
  mkdir -p "$(dirname "$ADMIN_ROUTE")"
  cat > "$ADMIN_ROUTE" <<'TS'
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const file = process.env.VOG_USAGE_FILE || "";
  if (!file || !existsSync(file)) {
    return NextResponse.json({ ok: true, items: [], note: "no usage file" }, { status: 200 });
  }
  const raw = await readFile(file, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const items = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const last24 = Date.now() - 24*60*60*1000;
  const filtered = items.filter((x:any)=> x.ts >= last24);

  const byRoute: Record<string, { count:number; ms:number; tokens:number }> = {};
  for (const it of filtered) {
    const k = it.route || "unknown";
    byRoute[k] ||= { count:0, ms:0, tokens:0 };
    byRoute[k].count += 1;
    byRoute[k].ms    += Number(it.ms||0);
    byRoute[k].tokens+= Number(it.totalTokens||0);
  }
  const summary = Object.entries(byRoute).map(([route,agg])=>({
    route, count: agg.count, avgMs: agg.count? Math.round(agg.ms/agg.count):0, totalTokens: agg.tokens
  })).sort((a,b)=> b.count-a.count);

  return NextResponse.json({ ok:true, summary, total: filtered.length }, { status:200 });
}
TS
  echo "  ✓ /api/admin/usage/summary angelegt"
else
  echo "  ↷ /api/admin/usage/summary existiert – unverändert gelassen"
fi

echo "→ Fertig. Neustarten: pnpm -F @vog/web dev"
