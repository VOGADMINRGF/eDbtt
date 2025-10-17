/* @ts-nocheck */
import { NextRequest, NextResponse } from "next/server";
// später: echte Worker/Queue einhängen
export async function POST(req: NextRequest) {
  const { draftId, claims } = await req.json().catch(()=>({}));
  if (!draftId || !Array.isArray(claims)) {
    return NextResponse.json({ ok:false, error:"draftId/claims missing" }, { status:400 });
  }
  // TODO: enqueue to worker (bull/redis or simple cron)
  console.log("[factcheck.enqueue]", { draftId, count: claims.length });
  return NextResponse.json({ ok:true, enqueued:true, draftId, count: claims.length });
}
