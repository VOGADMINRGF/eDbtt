import { NextResponse } from "next/server";
import { callOpenAI } from "@features/ai/providers/openai";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
export const dynamic = "force-dynamic";

export async function GET() {
  const routeClassification = resolveAiRouteClassification("/api/diag/gpt");
  const t0 = Date.now();
  try {
    const prompt = 'Gib NUR JSON: {"ok":true,"echo":"hi"}';
    const out = await callOpenAI({
      prompt,
      asJson: true,
      signal: AbortSignal.timeout(
        Number(process.env.OPENAI_TIMEOUT_MS || 18000),
      ),
    });
    return NextResponse.json({
      ok: true,
      text: out.text,
      raw: out.raw,
      timeMs: Date.now()-t0,
      meta: { routeClassification },
    });
  } catch (e:any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), meta: { routeClassification } },
      { status: 500 },
    );
  }
}
