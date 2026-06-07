import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import {
  createEditorialReviewRequest,
  EDITORIAL_REVIEW_REQUEST_REASONS,
  EDITORIAL_REVIEW_REQUEST_SOURCE_TYPES,
} from "@features/editorialReviewQueue";
import { buildLandingContributionDraft } from "@/features/start/landingCreateLight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    sourceType: z.enum(EDITORIAL_REVIEW_REQUEST_SOURCE_TYPES),
    sourceId: z.string().trim().min(1).optional(),
    originalText: z.string().trim().min(1),
    analysisRunId: z.string().trim().min(1).optional(),
    truthStatus: z
      .enum([
        "draft_analysis",
        "source_open",
        "source_grounded",
        "review_required",
        "factcheck_requested",
        "factcheck_passed",
        "sealed_verified",
      ])
      .optional(),
    sourceSupport: z
      .enum(["none", "open", "inferred", "partial", "sourced", "sealed"])
      .optional(),
    sourceStatus: z.string().trim().min(1).optional(),
    reviewRecommended: z.boolean().optional(),
    verificationLabel: z.enum(["analysiert", "geprueft", "verifiziert"]).optional(),
    reason: z.enum(EDITORIAL_REVIEW_REQUEST_REASONS).optional(),
    userNote: z.string().trim().min(1).max(1000).optional(),
    fallbackUsed: z.boolean().optional(),
    disagreementPresent: z.boolean().optional(),
    insufficientIndependentSuccess: z.boolean().optional(),
    noSourceBluffingPassed: z.boolean().optional(),
    moderationRequired: z.boolean().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  const userId = sessionUser?._id?.toHexString?.() ?? null;
  if (!sessionUser || !sessionUser.sessionValid || !userId) {
    return NextResponse.json(
      {
        ok: false,
        error: "not_authenticated",
        message: "Bitte melde dich an, um eine redaktionelle Prüfung anzufragen.",
      },
      { status: 401 },
    );
  }

  try {
    const body = BodySchema.parse(await req.json());
    const draft = buildLandingContributionDraft(body.originalText);
    if (
      draft.relevanceClassification === "spam_suspected" ||
      draft.relevanceClassification === "abusive_or_empty" ||
      draft.guardrails.isTooShort
    ) {
      const error =
        draft.relevanceClassification === "spam_suspected"
          ? "review_not_allowed"
          : draft.relevanceClassification === "abusive_or_empty"
            ? "review_requires_rework"
            : "review_text_too_short";
      return NextResponse.json(
        {
          ok: false,
          error,
          message:
            draft.guardrails.blockingMessage ??
            "Bitte überarbeite den Text, bevor du eine redaktionelle Prüfung anfragst.",
        },
        { status: 400 },
      );
    }
    const result = await createEditorialReviewRequest({
      sourceType: body.sourceType,
      sourceId: body.sourceId ?? null,
      userId,
      originalText: body.originalText,
      analysisRunId: body.analysisRunId ?? null,
      truthStatus: body.truthStatus ?? null,
      sourceSupport: body.sourceSupport ?? null,
      sourceStatus: body.sourceStatus ?? null,
      reviewRecommended: body.reviewRecommended ?? null,
      verificationLabel: body.verificationLabel ?? null,
      reason: body.reason ?? null,
      userNote: body.userNote ?? null,
      fallbackUsed: body.fallbackUsed ?? null,
      disagreementPresent: body.disagreementPresent ?? null,
      insufficientIndependentSuccess: body.insufficientIndependentSuccess ?? null,
      noSourceBluffingPassed: body.noSourceBluffingPassed ?? null,
      moderationRequired: body.moderationRequired ?? null,
    });

    return NextResponse.json({
      ok: true,
      deduped: result.deduped,
      message: result.deduped
        ? "Diese Prüfbitte ist bereits zur manuellen Prüfung vorgemerkt."
        : "Nicht veröffentlicht · zur manuellen Prüfung vorgemerkt.",
      reviewRequest: result.reviewRequest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "editorial_review_request_failed";
    const status =
      message === "editorial_review_rate_limited"
        ? 429
        : message === "editorial_review_text_required"
          ? 422
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
