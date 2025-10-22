#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
WEB="$ROOT/apps/web"
FEAT="$ROOT/features"

echo "▶ GPT-only + Debug for analyze…"

# 1) Robustere analyzeContribution (GPT-only, keine Heuristik/Fallback, Debug-Raw optional)
mkdir -p "$FEAT/analyze"
cat > "$FEAT/analyze/analyzeContribution.ts" <<'TS'
import { callOpenAIJson } from "../ai/providers";

type C = {
  text: string;
  categoryMain?: string|null;
  categorySubs?: string[];
  region?: string|null;
  authority?: string|null;
  canon?: string|null;
  scoreHints?: { baseWeight?: number; reasons?: string[] };
};

export async function analyzeContribution(text: string, opts: {
  maxClaims?: number;
  context?: any;
  debug?: boolean;
} = {}) {
  const t0 = Date.now();
  const errors: string[] = [];
  const maxClaims = Math.max(1, Number(opts.maxClaims ?? 5));
  let rawRes: any = null;
  let outText = "";

  // 🔒 GPT-only – keine ARI-Aufrufe hier
  const prompt = [
    "Analysiere den folgenden Bürgertext. Antworte NUR mit gültigem JSON (RFC8259).",
    "Schema: {",
    '  "language": "de"|"en"|null,',
    '  "mainTopic": string|null,',
    '  "subTopics": string[],',
    '  "regionHint": string|null,',
    '  "claims": [ { "text": string, "categoryMain": string|null, "categorySubs": string[], "region": string|null, "authority": string|null } ],',
    '  "news": [], "scoreHints": { "baseWeight": number, "reasons": string[] }, "cta": null',
    "}",
    "Beachte: maximal " + maxClaims + " prägnante Claims; keine Erklärtexte.",
    "Text:",
    text
  ].join("\n");

  try {
    const { text: t, raw } = await callOpenAIJson(prompt, 1600);
    rawRes = raw;
    outText = String(t || "");
    const parsed = JSON.parse(outText || "{}");

    // 🧹 Normalisierung (Deutsch, „Opinion“ → „Meinung“)
    if (parsed?.claims && Array.isArray(parsed.claims)) {
      parsed.claims = (parsed.claims as C[]).slice(0, maxClaims).map((c) => {
        const cat = (c?.categoryMain ?? null);
        // simple de-normalization
        const catDE = (cat && String(cat).toLowerCase() === "opinion") ? "Meinung" : cat;
        return {
          text: String(c?.text || "").trim(),
          categoryMain: catDE,
          categorySubs: Array.isArray(c?.categorySubs) ? c.categorySubs : [],
          region: c?.region ?? null,
          authority: c?.authority ?? null,
        } as C;
      }).filter(c => c.text);
    } else {
      parsed.claims = [];
    }

    const res = {
      language: parsed?.language ?? null,
      mainTopic: parsed?.mainTopic ?? null,
      subTopics: Array.isArray(parsed?.subTopics) ? parsed.subTopics : [],
      regionHint: parsed?.regionHint ?? null,
      claims: parsed.claims,
      news: Array.isArray(parsed?.news) ? parsed.news : [],
      scoreHints: parsed?.scoreHints ?? null,
      cta: parsed?.cta ?? null,
      _meta: {
        mode: "gpt",
        errors,
        tookMs: Date.now() - t0,
        gptRaw: opts.debug ? rawRes : undefined,
        gptText: opts.debug ? outText : undefined
      }
    };
    return res;
  } catch (e:any) {
    errors.push("GPT JSON parse failed: " + String(e?.message || e));
    return {
      language: null, mainTopic: null, subTopics: [], regionHint: null,
      claims: [], news: [], scoreHints: null, cta: null,
      _meta: { mode: "error", errors, tookMs: Date.now() - t0, gptRaw: opts.debug ? rawRes : undefined, gptText: opts.debug ? outText : undefined }
    };
  }
}
TS

# 2) API-Route: debug-Flag (Query ODER Body) durchreichen
mkdir -p "$WEB/src/app/api/contributions/analyze"
cat > "$WEB/src/app/api/contributions/analyze/route.ts" <<'TS'
/**
 * apps/web/src/app/api/contributions/analyze/route.ts
 * GPT-only, transparent debug; KEIN Fallback/Heuristik.
 */
import { NextResponse } from "next/server";
import { analyzeContribution } from "@features/analyze/analyzeContribution";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const qDebug = url.searchParams.get("debug");
  const body = await req.json().catch(() => ({} as any));
  const debug = body?.debug ?? (qDebug === "1" || qDebug === "true");

  const text = String(body?.text || "");
  const maxClaims = Number(body?.maxClaims ?? 5);
  const context = body?.context ?? {};

  const res = await analyzeContribution(text, { maxClaims, context, debug });
  return NextResponse.json(res);
}
TS

echo "✓ Files written."

echo "🧹 Clear Next cache & restart dev…"
rm -rf "$WEB/.next" || true
pkill -f "next dev" || true
pnpm --filter @vog/web dev
