export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { collectGraphHealthSnapshot } from "@features/graphAdmin/diagnostics";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const windowDays = Math.max(1, Number(req.nextUrl.searchParams.get("windowDays") ?? 30));
  try {
    const snapshot = await collectGraphHealthSnapshot(windowDays);
    const statusCode = snapshot.status === "unavailable" ? 503 : 200;

    return NextResponse.json({
      ok: true,
      ...snapshot,
    }, { status: statusCode });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "graph_error" }, { status: 500 });
  }
}
