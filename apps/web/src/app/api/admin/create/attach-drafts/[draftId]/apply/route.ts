import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { applyCreatePrepareAttachDraft } from "@/features/create/attachDraftApply";

const ApplyBodySchema = z.object({
  applyNote: z.string().max(800).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { draftId } = await ctx.params;

  let body: z.infer<typeof ApplyBodySchema>;
  try {
    body = ApplyBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  try {
    const item = await applyCreatePrepareAttachDraft({
      actor: gate.actor,
      draftId,
      applyNote: body.applyNote ?? null,
    });
    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "attach_draft_apply_failed";
    const status =
      message === "invalid_attach_draft_id"
        ? 400
        : message === "attach_draft_not_found"
        ? 404
        : message === "actor_scope_forbidden"
        ? 403
        : message === "attach_draft_review_state_not_accepted"
        ? 409
        : message === "attach_draft_already_applied"
        ? 409
        : message === "unsupported_attach_target_type"
        ? 409
        : message === "invalid_attach_target_id"
        ? 400
        : message === "attach_target_not_found"
        ? 404
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
