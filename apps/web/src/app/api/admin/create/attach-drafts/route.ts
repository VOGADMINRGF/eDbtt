import { NextRequest, NextResponse } from "next/server";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { normalizeCreatePrepareAttachDraftReviewState, listCreatePrepareAttachDraftQueue } from "@/features/create/attachDraftReviewQueue";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const reviewState = normalizeCreatePrepareAttachDraftReviewState(params.get("reviewState"));
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(params.get("pageSize") ?? 20)));
  const q = String(params.get("q") || "");

  try {
    const result = await listCreatePrepareAttachDraftQueue({
      actor: gate.actor,
      reviewState,
      page,
      pageSize,
      q,
    });
    return NextResponse.json({
      ok: true,
      items: result.items,
      total: result.total,
      page,
      pageSize,
      filters: {
        reviewState,
        q: q.trim() || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "attach_draft_review_queue_failed";
    const status = message === "actor_scope_forbidden" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
