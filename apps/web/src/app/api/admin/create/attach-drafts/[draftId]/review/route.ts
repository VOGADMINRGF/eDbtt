import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  isCreatePrepareAttachDraftReviewDecision,
  type CreatePrepareAttachDraftReviewDecision,
} from "@/features/create/prepareAttachDraft";
import { reviewCreatePrepareAttachDraft } from "@/features/create/attachDraftReviewQueue";

const ReviewBodySchema = z.object({
  decision: z.string().min(1).max(64),
  reviewNote: z.string().max(800).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { draftId } = await ctx.params;

  let body: z.infer<typeof ReviewBodySchema>;
  try {
    body = ReviewBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!isCreatePrepareAttachDraftReviewDecision(body.decision)) {
    return NextResponse.json({ ok: false, error: "invalid_review_decision" }, { status: 400 });
  }

  try {
    const item = await reviewCreatePrepareAttachDraft({
      actor: gate.actor,
      draftId,
      decision: body.decision as CreatePrepareAttachDraftReviewDecision,
      reviewNote: body.reviewNote ?? null,
    });
    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "attach_draft_review_failed";
    const status =
      message === "invalid_attach_draft_id"
        ? 400
        : message === "attach_draft_not_found"
        ? 404
        : message === "actor_scope_forbidden"
        ? 403
        : message === "attach_draft_state_conflict"
        ? 409
        : message === "attach_draft_already_applied"
        ? 409
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
