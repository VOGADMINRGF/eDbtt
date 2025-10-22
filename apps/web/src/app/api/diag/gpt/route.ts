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
