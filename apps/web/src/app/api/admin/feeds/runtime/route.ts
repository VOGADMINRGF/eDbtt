import { NextRequest, NextResponse } from "next/server";
import { buildFeedRadarRuntimeReadModel } from "@features/feeds/runtimeReadModel";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(request);
  if (gate instanceof Response) return gate;

  try {
    const model = await buildFeedRadarRuntimeReadModel();
    return NextResponse.json({ ok: true, runtime: model });
  } catch (error) {
    console.error("[/api/admin/feeds/runtime] failed", error);
    return NextResponse.json(
      { ok: false, error: "feed_runtime_unavailable" },
      { status: 503 },
    );
  }
}
