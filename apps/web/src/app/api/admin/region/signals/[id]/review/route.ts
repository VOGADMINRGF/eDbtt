import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { reviewRegionalCommunitySignal } from "@features/region";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await params;

  try {
    const body = await req.json();
    const signal = await reviewRegionalCommunitySignal({
      id,
      reviewStatus: body?.reviewStatus,
    });
    return NextResponse.json({ ok: true, signal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "community_signal_review_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "community_signal_not_found" ? 404 : 400 },
    );
  }
}
