export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { buildRegionalAgentRunDetailReadModel } from "@/features/marketing/registry/regionalRuns/readModel";

type RouteContext = {
  params: Promise<{ runId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { runId } = await context.params;
  const readModel = buildRegionalAgentRunDetailReadModel(runId);
  if (!readModel) {
    return NextResponse.json({ ok: false, error: "regional_agent_run_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, readModel });
}
