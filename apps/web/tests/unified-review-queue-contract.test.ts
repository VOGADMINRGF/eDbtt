import { describe, expect, it } from "vitest";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { createReviewQueueItemFromHandoffDraft } from "@/features/create/createHandoffReviewQueue";
import { createHandoffDraftFromDialogOutcome } from "@/features/create/createHandoffDrafts";
import {
  buildUnifiedReviewQueueItemFromCreateHandoff,
  buildUnifiedReviewQueueItemFromParticipationCandidate,
  buildUnifiedReviewQueueItemFromSocialOutputDraft,
  buildUnifiedReviewQueueItemFromVoxyVideoBriefing,
} from "@/features/create/unifiedReviewQueueContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import { DIALOG_INTELLIGENCE_PREVIEW_FIXTURES } from "@/features/dialog/dialogIntelligenceFixtures";
import { buildVoxyVideoBriefing } from "@/features/voxyVideo";

describe("unified review queue contract", () => {
  it("reuses the existing create handoff review world and keeps review_ready non-approved", () => {
    const draft = createHandoffDraftFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
      "dossier_candidate",
    );
    const queueItem = createReviewQueueItemFromHandoffDraft(draft);
    const sourcePack = buildCanonicalSourcePack({
      sourcePackId: "sp-1",
      sources: [{ sourceId: "s-1", title: "Quelle", evidenceState: "supported" }],
    });
    const languageBridge = buildCanonicalLanguageBridgeRecord({
      sourceLanguage: "de",
      contentLanguage: "de",
      uiLocale: "de",
      originalText: "Original",
    });

    const unified = buildUnifiedReviewQueueItemFromCreateHandoff(queueItem, {
      sourcePack,
      languageBridge,
    });

    expect(unified.reviewWorld).toBe("existing_review_queue");
    expect(unified.requiredReviewType).toBe("editorial_review");
    expect(unified.reviewReadyIsApproved).toBe(false);
    expect(unified.publishGuard.publishActionEnabled).toBe(false);
  });

  it("maps participation, social draft and voxy briefing candidates into the same review queue semantics", () => {
    const participation = buildParticipationHandoffCandidate({
      id: "poll-1",
      recommendation: "poll",
      title: "Poll",
      prompt: "Neutral formuliert.",
    });
    const socialDraft = buildDossierSocialOutputDraft({
      draftId: "social-1",
      dossierId: "d-1",
      kind: "linkedin_draft",
      title: "LinkedIn",
      summary: "Nur Review-Entwurf.",
      preparationStatus: "publish_ready",
    });
    const voxy = buildVoxyVideoBriefing({
      briefingId: "voxy-1",
      sourceContextKind: "dossier",
      sourceContextId: "d-1",
      title: "Voxy Briefing",
      summary: "Noch kein Rendering.",
      languageBridge: buildCanonicalLanguageBridgeRecord({
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        originalText: "Original",
      }),
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-2",
        sources: [{ sourceId: "s-2", title: "Quelle", evidenceState: "partial" }],
      }),
    });

    expect(
      buildUnifiedReviewQueueItemFromParticipationCandidate(participation)
        .requiredReviewType,
    ).toBe("moderation_review");
    expect(
      buildUnifiedReviewQueueItemFromSocialOutputDraft(socialDraft).queueState,
    ).toBe("publish_ready");
    expect(
      buildUnifiedReviewQueueItemFromVoxyVideoBriefing(voxy)
        .requiredReviewType,
    ).toBe("voxy_script_review");
  });
});
