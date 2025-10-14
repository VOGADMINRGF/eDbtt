//final

import { NextResponse } from "next/server";
import { analyzeContribution } from "@core/gpt/analyzeContribution";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { content, mode = "impact", locale = "de" } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content_required" }, { status: 400 });
    }
    const parsed = await analyzeContribution({ mode, content, locale });
    return NextResponse.json({ ok: true, result: parsed });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
