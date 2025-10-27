import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import { step_analyze_multi_llm } from "@/app/pipeline/steps/analyze_multi_llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || (process.env.VOG_ANALYZE_MODE || "gpt");
    const body = await req.json();
    const text = String(body?.text ?? "").trim();
    const maxClaims = body?.maxClaims ?? 3;

    if (!text) {
      return NextResponse.json({ error: "Kein Text übergeben.", status: 400 }, { status: 200 });
    }

    const result = mode === "multi"
      ? await step_analyze_multi_llm(text, { maxClaims })
      : await analyzeContribution(text, { maxClaims });

    if (req.nextUrl.searchParams.get("clarify") === "1") {
      try {
        const { clarify } = await import("@/features/analyze/clarify");
        const qs = await clarify(text);
        if (Array.isArray(qs) && qs.length) (result as any).followUps = qs.slice(0,5);
      } catch {}
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ _meta:{ mode:"error", errors:[String(e?.message||e)], tookMs:0 } }, { status: 200 });
  }
}
