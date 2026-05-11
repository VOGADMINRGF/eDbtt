import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  createRegionalCommunitySignal,
  listRegionalCommunitySignals,
  type CommunitySignalQueueQuery,
} from "@features/region";

function parseQuery(req: NextRequest): CommunitySignalQueueQuery {
  const search = req.nextUrl.searchParams;
  return {
    regionId: search.get("regionId"),
    signalType: (search.get("signalType") as CommunitySignalQueueQuery["signalType"]) ?? "all",
    reviewStatus: (search.get("reviewStatus") as CommunitySignalQueueQuery["reviewStatus"]) ?? "all",
    limit: search.get("limit") ? Number(search.get("limit")) : undefined,
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const items = await listRegionalCommunitySignals(parseQuery(req));
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const body = await req.json();
    const signal = await createRegionalCommunitySignal(body);
    return NextResponse.json({ ok: true, signal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "community_signal_create_failed" },
      { status: 400 },
    );
  }
}
