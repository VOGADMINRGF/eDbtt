#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
WEB="$ROOT/apps/web"

echo "▶ Add diagnostic routes…"

# _diag (wie zuvor) – falls Next es doch nimmt
mkdir -p "$WEB/src/app/api/_diag/gpt"
cat > "$WEB/src/app/api/_diag/gpt/route.ts" <<'TS'
import { NextResponse } from "next/server";
import { callOpenAI } from "@features/ai/providers/openai";
export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    const prompt = 'Gib NUR JSON: {"ok":true,"echo":"pong","ts":"2025-01-01T00:00:00Z"}';
    const { text, raw } = await callOpenAI(prompt, { forceJsonMode: true, timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS||18000) });
    return NextResponse.json({ ok:true, text, timeMs: Date.now()-t0, usage: raw?.usage ?? null }, { status:200 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e), timeMs: Date.now()-t0 }, { status:500 });
  }
}
TS

# diag (ohne Unterstrich) – garantiert erreichbar unter /api/diag/gpt
mkdir -p "$WEB/src/app/api/diag/gpt"
cat > "$WEB/src/app/api/diag/gpt/route.ts" <<'TS'
import { NextResponse } from "next/server";
import { callOpenAI } from "@features/ai/providers/openai";
export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    const prompt = 'Gib NUR JSON: {"ok":true,"echo":"pong","ts":"2025-01-01T00:00:00Z"}';
    const { text, raw } = await callOpenAI(prompt, { forceJsonMode: true, timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS||18000) });
    return NextResponse.json({ ok:true, text, timeMs: Date.now()-t0, usage: raw?.usage ?? null }, { status:200 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e), timeMs: Date.now()-t0 }, { status:500 });
  }
}
TS

echo "✓ Routes written."

echo "🧹 Clear Next cache & restart dev…"
rm -rf "$WEB/.next" || true
pkill -f "next dev" || true
pnpm --filter @vog/web dev
