#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.."; pwd)"

echo "▶️  Writing /features/ai/providers.ts …"
mkdir -p "$ROOT/features/ai"
cat > "$ROOT/features/ai/providers.ts" <<'TS'
// features/ai/providers.ts
// Unified provider calls (OpenAI Responses API + ARI (YOU.com) fallback)

export type AriPayload = { text: string };
export type OpenAIOpts = { model?: string; effort?: "low"|"medium"|"high" };

/** Call OpenAI Responses API with JSON mode (text.format: json_object). */
export async function callOpenAI(text: string, opts: OpenAIOpts = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const model = opts.model || process.env.OPENAI_MODEL || "gpt-5";
  const effort = opts.effort || (process.env.OPENAI_REASONING_EFFORT as any) || "medium";

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      reasoning: { effort },
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "Du extrahierst politische/verwaltungsnahe Aussagen (Claims). Antworte ausschließlich als JSON-Objekt in unserem Schema."
          }]
        },
        {
          role: "user",
          // WICHTIG: 'format: json' im Text, damit text.format greift
          content: [{ type: "input_text", text: "format: json\n\n" + String(text || "").slice(0, 8000) }]
        }
      ],
      // JSON mode korrekt als Objekt:
      text: { format: { type: "json_object" } },
      max_output_tokens: 1500
    })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status} – ${JSON.stringify(json)}`);
  }

  // Responses-API: bevorzugt output_text; fallback auf content[0].text
  const outText = (json.output_text
      ?? json.output?.[0]?.content?.[0]?.text
      ?? "").trim();

  return outText;
}

/** Call ARI orchestrator. Prefers ARI_ANALYZE_URL; falls nicht gesetzt, fällt sauber zurück. */
export async function callARI(payload: AriPayload) {
  const url = process.env.ARI_ANALYZE_URL || process.env.YOUCOM_RESEARCH_URL || "";
  if (!url) throw new Error("ARI endpoint missing (set ARI_ANALYZE_URL or YOUCOM_RESEARCH_URL)");

  const headers: Record<string,string> = { "content-type": "application/json" };
  if (process.env.YOUCOM_ARI_API_KEY) headers.authorization = `Bearer ${process.env.YOUCOM_ARI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => null as any);
  if (!res.ok) throw new Error(`ARI ${res.status} – ${JSON.stringify(json ?? {})}`);

  return json;
}
TS

echo "▶️  Writing /features/analyze/analyzeContribution.ts …"
mkdir -p "$ROOT/features/analyze"
cat > "$ROOT/features/analyze/analyzeContribution.ts" <<'TS'
// features/analyze/analyzeContribution.ts
import { callOpenAI, callARI } from "../ai/providers";

type Claim = {
  text: string;
  categoryMain: string | null;
  categorySubs: string[];
  region: string | null;
  authority: string | null;
  relevance?: number;
};

export type AnalyzeResult = {
  language: string;
  mainTopic: string | null;
  subTopics: string[];
  regionHint: string | null;
  claims: Claim[];
};

type Options = { model?: string; forceFallback?: boolean };

/** Biegt beliebige Antworten in unser Zielschema. */
function coerceToAnalyzeResult(src: any, original: string): AnalyzeResult {
  const safeClaims: Claim[] = Array.isArray(src?.claims) ? src.claims : [];
  const claims = safeClaims
    .map((c: any) => ({
      text: String(c?.text ?? "").trim().replace(/\s+/g, " ").slice(0, 240),
      categoryMain: c?.categoryMain ?? null,
      categorySubs: Array.isArray(c?.categorySubs) ? c.categorySubs.slice(0, 2) : [],
      region: c?.region ?? null,
      authority: c?.authority ?? null,
      relevance: typeof c?.relevance === "number" ? Math.max(1, Math.min(5, Math.round(c.relevance))) : 3,
    }))
    .filter((c: Claim) => !!c.text);

  if (!claims.length && original) {
    claims.push({
      text: String(original).slice(0, 240),
      categoryMain: null,
      categorySubs: [],
      region: null,
      authority: null,
    });
  }

  return {
    language: (src?.language || "de").slice(0, 5),
    mainTopic: src?.mainTopic ?? null,
    subTopics: Array.isArray(src?.subTopics) ? src.subTopics : [],
    regionHint: src?.regionHint ?? null,
    claims,
  };
}

/** Hauptanalyse: OpenAI → ARI (Fallback) → Echo */
export async function analyzeContribution(text: string, opts: Options = {}): Promise<AnalyzeResult & { _meta?: any }> {
  const t = String(text ?? "").trim();

  async function runGPT() {
    const raw = await callOpenAI(t, { model: opts.model, effort: "medium" });
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
    const out = coerceToAnalyzeResult(parsed, t);
    (out as any)._meta = { mode: "gpt" };
    return out;
  }

  async function runARI(gptError?: unknown) {
    const json = await callARI({ text: t });
    const out = coerceToAnalyzeResult(json, t);
    (out as any)._meta = { mode: "ari", gptError: gptError ? String((gptError as any)?.message ?? gptError) : undefined };
    return out;
  }

  // explizit ARI erzwingen (z.B. für Tests)
  if (opts.forceFallback) {
    try { return await runARI("forced"); }
    catch (eForced) {
      const out = coerceToAnalyzeResult(null, t);
      (out as any)._meta = { mode: "fallback", gptError: "forced", ariError: String((eForced as any)?.message ?? eForced) };
      return out;
    }
  }

  try {
    return await runGPT();
  } catch (e1) {
    try {
      return await runARI(e1);
    } catch (e2) {
      const out = coerceToAnalyzeResult(null, t);
      (out as any)._meta = { mode: "fallback", gptError: String((e1 as any)?.message ?? e1), ariError: String((e2 as any)?.message ?? e2) };
      return out;
    }
  }
}
TS

# Patch API-Route (nur, falls vorhanden & notwendig)
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
if [ -f "$ROUTE" ]; then
  echo "▶️  Patching API route import + body handling …"
  perl -0777 -pe '
    s#import .*analyzeContribution.*;\n#import { analyzeContribution } from "../../../../../../features/analyze/analyzeContribution";\n#s
  ' -i "$ROUTE"

  perl -0777 -pe '
    s#export async function POST\([^\)]*\)\s*\{[^\}]*\}#export async function POST(req: Request) {\n  const body = await req.json().catch(() => ({} as any));\n  const text = String(body?.text ?? \"\");\n  const maxClaims = Number(body?.maxClaims ?? 3);\n  const model = body?.model as string | undefined;\n  const forceFallback = !!body?.forceFallback;\n  try {\n    const out: any = await analyzeContribution(text, { model, forceFallback });\n    if (Array.isArray(out.claims) && out.claims.length > maxClaims) out.claims = out.claims.slice(0, maxClaims);\n    return new Response(JSON.stringify(out), { headers: { \"content-type\": \"application/json\" } });\n  } catch (e: any) {\n    const fb = { language: \"de\", mainTopic: null, subTopics: [], regionHint: null, claims: text ? [{ text: text.slice(0,180), categoryMain: null, categorySubs: [], region: null, authority: null }] : [], _meta: { mode: \"fallback\", error: String(e?.message ?? e) } };\n    return new Response(JSON.stringify(fb), { status: 200, headers: { \"content-type\": \"application/json\" } });\n  }\n}\n#s
  ' -i "$ROUTE" || true
fi

echo "🧹 Cleanup duplicate analyzer files under apps/web/src (keep /features)…"
rm -rf "$ROOT/apps/web/src/features/analyze" 2>/dev/null || true
find "$ROOT" -type f -name "*.bak" -o -name "*.BAK" -delete 2>/dev/null || true

echo "✅ Done. Now run:  pnpm --filter @vog/web dev"
