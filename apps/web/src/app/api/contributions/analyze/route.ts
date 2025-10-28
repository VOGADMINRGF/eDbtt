// apps/web/src/app/api/contributions/analyze/route.ts
import { NextResponse } from "next/server";
import { orchestrateClaim, orchestrateClaimsV2 } from "@features/ai/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text, texts } = await req.json().catch(()=> ({}));
    if (!text && !Array.isArray(texts)) {
      return NextResponse.json({ ok:false, error:"missing text(s)" }, { status: 400 });
    }
    if (Array.isArray(texts)) {
      const items = await orchestrateClaimsV2(texts);
      return NextResponse.json({ ok:true, items });
    }
    const result = await orchestrateClaim(String(text ?? ""));
    return NextResponse.json({ ok:true, result });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status: 500 });
  }
}
