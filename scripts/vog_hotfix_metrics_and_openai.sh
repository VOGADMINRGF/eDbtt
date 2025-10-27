#!/usr/bin/env bash
set -euo pipefail

root="$(pwd)"
web="apps/web"
prov="features/ai/providers/openai.ts"
usage="$web/src/lib/metrics/usage.ts"
route="$web/src/app/api/contributions/analyze/route.ts"

echo "→ Root: $root"

# 1) OpenAI Provider: Lazy client (kein Throw beim Import)
if [ -f "$prov" ]; then
  cp -n "$prov" "$prov.bak.$(date +%s)" || true
  cat > "$prov" <<'TS'
import OpenAI from "openai";

export type ProviderId = "openai";
export type OpenAIOptions = {
  timeoutMs?: number;
  forceJsonMode?: boolean;
  system?: string;
};

let _client: OpenAI | null = null;
function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

function toInt(v: any, defVal: number): number {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : defVal;
}

export async function callOpenAI(
  prompt: string,
  opts: OpenAIOptions = {}
): Promise<{ text: string; raw: any }> {
  const client = getOpenAI(); // lazy
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  const timeout = toInt(opts.timeoutMs ?? process.env.OPENAI_TIMEOUT_MS ?? 18000, 18000);
  const body: any = {
    model,
    input: prompt,
    ...(opts.forceJsonMode ? { text: { format: { type: "json_object" } } } : {})
  };
  const res = await client.responses.create(body, { timeout });
  const data: any = res;
  let text = "";
  if (typeof data.text === "string" && data.text.trim()) text = data.text;
  if (!text && typeof data.output_text === "string" && data.output_text.trim()) text = data.output_text;
  if (!text && Array.isArray(data.output)) {
    const msg = data.output.find((o: any) => o?.type === "message") || data.output[0];
    const parts = Array.isArray(msg?.content)
      ? msg.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean)
      : [];
    if (parts.length) text = parts.join("\n");
  }
  return { text: text || "", raw: data };
}

export async function runOpenAI(
  prompt: string,
  opts: { json?: boolean; maxOutputTokens?: number; system?: string; timeoutMs?: number } = {}
): Promise<{ ok: boolean; text: string; raw?: any; usage?: any; ms?: number; error?: string; skipped?: boolean }> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  if (!key) return { ok: false, text: "", skipped: true, error: "OPENAI_API_KEY missing" };

  const body: any = {
    model,
    input: String(prompt || ""),
    ...(opts.system ? { instructions: String(opts.system) } : {}),
    ...(opts.json ? { text: { format: { type: "json_object" } } } : {}),
  };

  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    return { ok: false, text: "", error: `OpenAI ${res.status} – ${msg}`, ms: Date.now() - t0 };
  }

  const data = await res.json();
  let out = "";
  if (typeof data?.text === "string") out = data.text;
  else if (Array.isArray(data?.output)) {
    const parts = data.output
      .flatMap((it: any) => (Array.isArray(it?.content) ? it.content : []))
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean);
    if (parts.length) out = parts.join("\n");
  }
  return { ok: true, text: out || "", raw: data, usage: data?.usage, ms: Date.now() - t0 };
}
TS
  echo "  ✓ Patched: $prov (lazy OpenAI client)"
else
  echo "  • SKIP: $prov nicht gefunden (ok, Monorepo variiert)"
fi

# 2) Metrics: recordUsage (No-Op, später erweiterbar)
mkdir -p "$(dirname "$usage")"
if [ ! -f "$usage" ]; then
  cat > "$usage" <<'TS'
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

/** Plug-in Sinks (z.B. Prisma/NDJSON) – default: noop */
type Sink = (e: UsageEvent) => Promise<void> | void;
let sink: Sink = async (_e) => { /* noop */ };

/** Optional: externen Sink registrieren (Admin/Prisma) */
export function setUsageSink(fn: Sink) { sink = fn; }

/** Safe-Recorder – wirft nie */
export async function recordUsage(e: UsageEvent): Promise<void> {
  try { await sink(e); } catch { /* swallow */ }
}
TS
  echo "  ✓ Wrote: $usage"
else
  echo "  • Exists: $usage"
fi

# 3) Analyze-Route: safe import + fallback
if [ -f "$route" ]; then
  cp -n "$route" "$route.bak.$(date +%s)" || true

  # ensure import present
  if ! grep -q '@/lib/metrics/usage' "$route"; then
    sed -i '' '1i\
import { recordUsage as recordUsageReal } from "@/lib/metrics/usage";
' "$route"
  fi

  # insert safe alias (once)
  if ! grep -q 'const recordUsage =' "$route"; then
    awk '1; NR==1{print ""} END{print ""}' "$route" > "$route.tmp" && mv "$route.tmp" "$route"
    sed -i '' $'2i\\\nconst recordUsage = (recordUsageReal ?? (async (_e:any)=>{}));\n' "$route"
  fi

  echo "  ✓ Hardened: $route (recordUsageSafe)"
else
  echo "  • SKIP: $route nicht gefunden"
fi

echo "→ Fertig. Starte dev neu: pnpm -F @vog/web dev"
