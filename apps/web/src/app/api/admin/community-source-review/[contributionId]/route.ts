import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  allowCommunitySourceReviewHint,
  clearCommunitySourceReviewHintAbuseSignals,
  clearCommunitySourceReviewTrustQualitySignals,
  escalateCommunitySourceReviewAbuseReview,
  escalateCommunitySourceReviewHint,
  getCommunitySourceReviewRecord,
  hideCommunitySourceReviewHint,
  markCommunitySourceReviewHintAsAbuseRisk,
  markCommunitySourceReviewHintAsSpamRisk,
  markCommunitySourceReviewHintNeedsEditorialReview,
  markCommunitySourceReviewHintNeedsSourceReview,
  markCommunitySourceReviewSourceQualityReviewed,
  markCommunitySourceReviewTrustQualityReviewed,
  rejectCommunitySourceReviewHint,
  setCommunitySourceReviewPriorityFromTrustQuality,
} from "@/features/create/communitySourceReviewServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  action: z.enum([
    "allowAsHint",
    "hideHint",
    "rejectHint",
    "escalateHint",
    "markNeedsSourceReview",
    "markNeedsEditorialReview",
    "markAsSpamRisk",
    "markAsAbuseRisk",
    "clearAbuseSignal",
    "escalateAbuseReview",
    "markSourceQualityReviewed",
    "markTrustQualityReviewed",
    "setReviewPriorityFromTrustQuality",
    "clearTrustQualitySignals",
  ]),
  note: z.string().trim().min(1).max(1000),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ contributionId: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  const params = await context.params;
  const contributionId = String(params.contributionId ?? "").trim();
  if (!contributionId) {
    return NextResponse.json(
      { ok: false, error: "missing_contribution_id" },
      { status: 400 },
    );
  }

  const existing = await getCommunitySourceReviewRecord(contributionId);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const actorUserId = gate._id?.toHexString?.() ?? "admin";
  const reason = parsed.data.note;

  try {
    const item =
      parsed.data.action === "allowAsHint"
        ? await allowCommunitySourceReviewHint({
            contributionId,
            actorUserId,
            reason,
          })
        : parsed.data.action === "hideHint"
          ? await hideCommunitySourceReviewHint({
              contributionId,
              actorUserId,
              reason,
            })
          : parsed.data.action === "rejectHint"
            ? await rejectCommunitySourceReviewHint({
                contributionId,
                actorUserId,
                reason,
              })
            : parsed.data.action === "escalateHint"
              ? await escalateCommunitySourceReviewHint({
                  contributionId,
                  actorUserId,
                  reason,
                })
              : parsed.data.action === "markNeedsSourceReview"
                ? await markCommunitySourceReviewHintNeedsSourceReview({
                    contributionId,
                    actorUserId,
                    reason,
                  })
                : parsed.data.action === "markNeedsEditorialReview"
                  ? await markCommunitySourceReviewHintNeedsEditorialReview({
                      contributionId,
                      actorUserId,
                      reason,
                    })
                  : parsed.data.action === "markAsSpamRisk"
                    ? await markCommunitySourceReviewHintAsSpamRisk({
                        contributionId,
                        actorUserId,
                        reason,
                      })
                    : parsed.data.action === "markAsAbuseRisk"
                      ? await markCommunitySourceReviewHintAsAbuseRisk({
                          contributionId,
                          actorUserId,
                          reason,
                        })
                      : parsed.data.action === "clearAbuseSignal"
                        ? await clearCommunitySourceReviewHintAbuseSignals({
                            contributionId,
                            actorUserId,
                            reason,
                          })
                        : parsed.data.action === "escalateAbuseReview"
                          ? await escalateCommunitySourceReviewAbuseReview({
                              contributionId,
                              actorUserId,
                              reason,
                            })
                          : parsed.data.action === "markSourceQualityReviewed"
                            ? await markCommunitySourceReviewSourceQualityReviewed({
                                contributionId,
                                actorUserId,
                                reason,
                              })
                            : parsed.data.action === "markTrustQualityReviewed"
                              ? await markCommunitySourceReviewTrustQualityReviewed({
                                  contributionId,
                                  actorUserId,
                                  reason,
                                })
                              : parsed.data.action === "setReviewPriorityFromTrustQuality"
                                ? await setCommunitySourceReviewPriorityFromTrustQuality({
                                    contributionId,
                                    actorUserId,
                                    reason,
                                  })
                                : await clearCommunitySourceReviewTrustQualitySignals({
                                    contributionId,
                                    actorUserId,
                                    reason,
                                  });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "community_source_review_action_failed";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status:
          message === "community_source_review_decision_blocked" ? 409 : 500,
      },
    );
  }
}
