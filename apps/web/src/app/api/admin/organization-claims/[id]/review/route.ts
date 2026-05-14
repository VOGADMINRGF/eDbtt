import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  getRegionOrganizationRuntimeRepo,
  ONBOARDING_ALLOWED_ACTIONS,
  VERIFICATION_REVIEW_DECISIONS,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ReviewBodySchema = z
  .object({
    decision: z.enum(VERIFICATION_REVIEW_DECISIONS),
    allowedActions: z.array(z.enum(ONBOARDING_ALLOWED_ACTIONS)).optional(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const reviewedBy = gate._id?.toHexString?.() ?? "";
  if (!reviewedBy) {
    return NextResponse.json({ ok: false, error: "missing_admin_id" }, { status: 400 });
  }

  try {
    const body = ReviewBodySchema.parse(await req.json());
    const { id } = await params;
    const repo = getRegionOrganizationRuntimeRepo();
    const result = await repo.reviewOrganizationClaim({
      claimId: id,
      reviewedBy,
      decision: body.decision,
      allowedActions: body.allowedActions,
      note: body.note ?? null,
    });

    return NextResponse.json({
      ok: true,
      claim: result.claim,
      membership: result.membership,
      review: result.review,
      auditEvents: result.auditEvents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "organization_claim_review_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "organization_claim_not_found" ? 404 : 400 },
    );
  }
}
