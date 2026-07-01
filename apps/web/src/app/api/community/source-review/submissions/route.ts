import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitFromRequest, rateLimitHeaders } from "@/utils/rateLimitHelpers";
import {
  submitPublicCommunitySourceReview,
  type CommunitySourceReviewPublicSubmissionCode,
} from "@/features/create/communitySourceReviewPublicSubmission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_SCHEMA = z.object({
  kind: z.string().trim().min(1).max(60),
  target: z.string().trim().min(1).max(60),
  targetId: z.string().trim().min(1).max(120),
  title: z.string().trim().max(160).optional(),
  text: z.string().trim().min(1).max(3000),
  language: z.string().trim().max(12).optional(),
  claimText: z.string().trim().max(320).optional(),
  sourceRefs: z.array(z.string().trim().max(600)).max(6).optional(),
  materialRefs: z.array(z.string().trim().max(600)).max(6).optional(),
  notes: z.array(z.string().trim().max(240)).max(6).optional(),
  participationSpaceSlugOrId: z.string().trim().max(120).optional(),
  honeypotValue: z.string().max(120).optional(),
});

const PUBLIC_SUBMISSION_RATE = {
  limit: 4,
  windowMs: 15 * 60 * 1000,
} as const;

function toPublicErrorMessage(codes: readonly CommunitySourceReviewPublicSubmissionCode[]) {
  if (codes.includes("participation_space_not_public")) {
    return "Hinweise können nur an veröffentlichte öffentliche Beteiligungsräume angehängt werden.";
  }
  if (codes.includes("public_runtime_lookup_failed")) {
    return "Der Hinweis konnte gerade nicht sicher zugeordnet werden. Bitte versuche es erneut.";
  }
  if (codes.includes("honeypot_blocked")) {
    return "Der Hinweis konnte in dieser Form nicht angenommen werden. Bitte versuche es erneut.";
  }
  return "Der Hinweis ist noch nicht vollständig oder konnte nicht sicher angenommen werden.";
}

export async function POST(req: NextRequest) {
  const rateLimit = await rateLimitFromRequest(
    req,
    PUBLIC_SUBMISSION_RATE.limit,
    PUBLIC_SUBMISSION_RATE.windowMs,
    { scope: "community-source-review-public-submission" },
  );
  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        message:
          "Zu viele Hinweise in kurzer Zeit. Bitte versuche es in ein paar Minuten erneut.",
      },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimit),
      },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = BODY_SCHEMA.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_payload",
        message:
          "Der Hinweis ist noch nicht vollständig oder enthält ungültige Felder.",
      },
      { status: 400 },
    );
  }

  const result = await submitPublicCommunitySourceReview(parsed.data);
  if (result.ok === false) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_submission",
        codes: result.codes,
        message: toPublicErrorMessage(result.codes),
        runtimeStatus: result.runtimeStatus,
      },
      { status: 400 },
    );
  }

  const statusCode = result.deduped ? 200 : 202;
  return NextResponse.json(
    {
      ok: true,
      deduped: result.deduped,
      status: result.status,
      message: result.publicMessage,
      runtimeStatus: result.runtimeStatus,
      submissionReference: result.submissionReference,
    },
    { status: statusCode },
  );
}
