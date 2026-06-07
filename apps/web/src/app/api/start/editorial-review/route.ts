import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { createEditorialReviewRequest } from "@features/editorialReviewQueue";
import {
  buildLandingContributionDraft,
  normalizeLandingContributionText,
  type LandingContributionEditorialReviewRequest,
  type LandingContributionRelevance,
} from "@/features/start/landingCreateLight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedClassification(classification: LandingContributionRelevance) {
  return classification === "needs_reframe" || classification === "personal_only";
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  const userId = sessionUser?._id?.toHexString?.() ?? null;
  if (!sessionUser || !sessionUser.sessionValid || !userId) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated", message: "Bitte melde dich an, um eine redaktionelle Prüfung anzufragen." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const originalText = typeof (body as any).originalText === "string" ? (body as any).originalText : "";
  const normalizedText = normalizeLandingContributionText(originalText);
  const userReason = typeof (body as any).userReason === "string" ? (body as any).userReason.trim() : "";
  const incomingClassification =
    typeof (body as any).relevanceClassification === "string"
      ? ((body as any).relevanceClassification as LandingContributionRelevance)
      : null;

  const draft = buildLandingContributionDraft(originalText);
  const effectiveClassification = draft.relevanceClassification;

  if (incomingClassification && incomingClassification !== effectiveClassification) {
    return NextResponse.json(
      {
        ok: false,
        error: "classification_mismatch",
        message: "Die Einordnung hat sich geändert. Bitte prüfe deinen Beitrag noch einmal.",
      },
      { status: 409 },
    );
  }

  if (!isAllowedClassification(effectiveClassification)) {
    return NextResponse.json(
      {
        ok: false,
        error: "review_not_allowed",
        message:
          effectiveClassification === "spam_suspected"
            ? "Eindeutige Werbung, Scam-Muster oder Linkspam leiten wir nicht in die redaktionelle Prüfung weiter."
            : "Für diese Eingabe ist keine redaktionelle Prüfung vorgesehen. Bitte überarbeite den Text zuerst.",
      },
      { status: 400 },
    );
  }

  if (effectiveClassification === "personal_only" && userReason.length < 12) {
    return NextResponse.json(
      {
        ok: false,
        error: "reason_required",
        message: "Bitte beschreibe kurz, warum dein Anliegen aus deiner Sicht öffentlich relevant ist.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createEditorialReviewRequest({
      sourceType: "user_relevance_appeal",
      userId,
      originalText,
      truthStatus: "draft_analysis",
      sourceSupport: "none",
      sourceStatus: "Analyse-Entwurf",
      reviewRecommended: true,
      verificationLabel: "analysiert",
      reason: "relevance_gate_appeal",
      userNote: userReason || null,
    });

    return NextResponse.json({
      ok: true,
      deduped: result.deduped,
      reviewRequest: {
        id: result.reviewRequest.id,
        originalText,
        normalizedText,
        relevanceClassification: effectiveClassification,
        userReason: userReason || null,
        createdAt: result.reviewRequest.createdAt,
        userId,
        contactEmail: null,
        status: "pending_review",
        source: "start_create_light",
        noAutoPublish: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoGraphPromotion: true,
        noAutoVote: true,
      } satisfies LandingContributionEditorialReviewRequest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "editorial_review_request_failed";
    if (message === "editorial_review_rate_limited") {
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          message: "Du hast heute bereits mehrere Prüfbitten vorgemerkt. Bitte versuche es später noch einmal.",
        },
        { status: 429 },
      );
    }
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
