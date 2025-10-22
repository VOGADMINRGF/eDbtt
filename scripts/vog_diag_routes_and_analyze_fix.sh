#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
WEB="$ROOT/apps/web"

echo "▶ Installing diagnostic routes & robust analyze endpoint…"

# 1) Diagnose-Route: GET /api/_diag/gpt
mkdir -p "$WEB/src/app/api/_diag/gpt"
cat > "$WEB/src/app/api/_diag/gpt/route.ts" <<'TS'
import { NextResponse } from "next/server";
import { callOpenAI } from "@features/ai/providers/openai";

export async function GET(req: Request) {
  const t0 = Date.now();
  try {
    const prompt = `Gib NUR JSON:\n{"ok":true,"echo":"pong","ts":"2025-01-01T00:00:00Z"}`;
    const { text, raw } = await callOpenAI(prompt, {
      forceJsonMode: true,
      timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 18000),
    });
    return NextResponse.json(
      { ok: true, text, timeMs: Date.now() - t0, usage: raw?.usage ?? null },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), timeMs: Date.now() - t0 },
      { status: 500 },
    );
  }
}
TS

# 2) stabile Analyze-Route: POST /api/contributions/analyze
mkdir -p "$WEB/src/app/api/contributions/analyze"
cat > "$WEB/src/app/api/contributions/analyze/route.ts" <<'TS'
// apps/web/src/app/api/contributions/analyze/route.ts
import { NextResponse } from "next/server";
import { analyzeContribution } from "@features/analyze/analyzeContribution";

export async function POST(req: Request) {
  const t0 = Date.now();
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1" || req.headers.get("x-debug") === "1";

    const body = await req.json().catch(() => ({} as any));
    const {
      text = "",
      maxClaims = 3,
      model,
      forceFallback,
      context = {},
    } = body || {};

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        {
          language: null,
          mainTopic: null,
          subTopics: [],
          regionHint: null,
          claims: [],
          news: [],
          scoreHints: null,
          cta: null,
          _meta: {
            mode: "error",
            errors: ["Missing 'text'"],
            tookMs: Date.now() - t0,
          },
        },
        { status: 400 },
      );
    }

    const result = await analyzeContribution(String(text), {
      maxClaims,
      model,
      forceFallback: !!forceFallback,
      context,
    });

    const meta = {
      mode: result?._meta?.mode ?? "gpt",
      errors: result?._meta?.errors ?? [],
      timings: result?._meta?.timings ?? undefined,
      tookMs: Date.now() - t0,
      ...(debug ? { debug: result?._meta ?? null } : {}),
    };

    return NextResponse.json({ ...result, _meta: meta }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        language: null,
        mainTopic: null,
        subTopics: [],
        regionHint: null,
        claims: [],
        news: [],
        scoreHints: null,
        cta: null,
        _meta: {
          mode: "error",
          errors: [String(e?.message || e)],
          tookMs: Date.now() - t0,
        },
      },
      { status: 500 },
    );
  }
}
TS

echo "✓ Files written."
echo "→ Restart dev server to pick up changes."
