export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { text?: string } | null;
    const text = (body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "text_required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await analyzeContribution(text);
    // Immer exakt dieses Shape zurückgeben:
    return NextResponse.json(
      { ok: true, data },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[/api/contributions/analyze] failed:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "internal_error", detail: String(err?.message || err).slice(0, 1000) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
