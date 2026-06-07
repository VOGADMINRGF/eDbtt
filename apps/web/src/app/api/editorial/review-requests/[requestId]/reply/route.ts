import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { buildLandingContributionDraft } from "@/features/start/landingCreateLight";
import { replyToEditorialReviewRequest } from "@features/editorialReviewQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    text: z.string().trim().min(1).max(2000),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      requestId: string;
    }>;
  },
) {
  const sessionUser = await getSessionUser(req);
  const userId = sessionUser?._id?.toHexString?.() ?? null;
  if (!sessionUser || !sessionUser.sessionValid || !userId) {
    return NextResponse.json(
      {
        ok: false,
        error: "not_authenticated",
        message: "Bitte melde dich an, um auf die redaktionelle Rückfrage zu antworten.",
      },
      { status: 401 },
    );
  }

  try {
    const body = BodySchema.parse(await req.json());
    const replyDraft = buildLandingContributionDraft(body.text);
    if (
      replyDraft.relevanceClassification === "spam_suspected" ||
      replyDraft.relevanceClassification === "abusive_or_empty" ||
      replyDraft.guardrails.isTooShort
    ) {
      const error =
        replyDraft.guardrails.isTooShort
          ? "review_text_too_short"
          : replyDraft.relevanceClassification === "spam_suspected"
          ? "review_not_allowed"
          : "review_requires_rework";
      return NextResponse.json(
        {
          ok: false,
          error,
          message:
            replyDraft.guardrails.blockingMessage ??
            "Bitte beantworte die Rückfrage mit etwas mehr Kontext und ohne Linkspam.",
        },
        { status: 400 },
      );
    }

    const params = await context.params;
    const requestId = decodeURIComponent(String(params.requestId ?? "").trim());
    const result = await replyToEditorialReviewRequest({
      requestId,
      userId,
      text: body.text,
    });

    return NextResponse.json({
      ok: true,
      message: "Antwort gespeichert. Noch nicht veröffentlicht.",
      reviewRequest: result.reviewRequest,
      userReply: result.userReply,
      historyEntry: result.historyEntry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "editorial_review_reply_failed";
    const status =
      message === "editorial_review_request_not_found"
        ? 404
        : message === "editorial_review_forbidden"
          ? 403
          : message === "editorial_review_invalid_transition"
            ? 409
            : message === "editorial_review_request_archived"
              ? 409
              : message === "editorial_review_reply_too_short"
                ? 400
                : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
