import { NextRequest, NextResponse } from "next/server";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { getCreatePrepareAttachDraftHistory } from "@/features/create/attachDraftReviewQueue";
import { isCreatePrepareAttachHistoryType } from "@/features/create/attachDraftHistory";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { draftId } = await ctx.params;
  const params = req.nextUrl.searchParams;
  const rawType = String(params.get("type") || "all").toLowerCase();
  if (!isCreatePrepareAttachHistoryType(rawType)) {
    return NextResponse.json({ ok: false, error: "invalid_history_type" }, { status: 400 });
  }
  const limit = Math.max(1, Math.min(100, Number(params.get("limit") ?? params.get("maxEventsPerType") ?? 80)));
  const cursor = params.get("cursor");

  try {
    const result = await getCreatePrepareAttachDraftHistory({
      actor: gate.actor,
      draftId,
      limit,
      cursor,
      type: rawType,
    });
    return NextResponse.json({
      ok: true,
      draft: result.draft,
      events: result.events,
      latestEvent: result.latestEvent,
      reviewEvents: result.reviewEvents,
      applyEvents: result.applyEvents,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      nextScanCursor: result.nextScanCursor,
      type: result.type,
      limit: result.limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "attach_draft_history_failed";
    const status =
      message === "invalid_attach_draft_id"
        ? 400
        : message === "invalid_history_cursor"
        ? 400
        : message === "attach_draft_not_found"
        ? 404
        : message === "actor_scope_forbidden"
        ? 403
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
