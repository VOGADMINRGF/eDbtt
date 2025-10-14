export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { analyzeContribution } from "@core/gpt/analyzeContribution";

export async function POST(req: Request) {
  try {
    const { mode, content, locale = "de" } = await req.json();
    if (!mode || !content)
      return NextResponse.json(
        { error: "mode & content required" },
        { status: 400 },
      );
    const result = await analyzeContribution({ mode, content, locale });
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
