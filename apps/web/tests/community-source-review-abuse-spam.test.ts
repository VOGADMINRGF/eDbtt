import { afterEach, describe, expect, it } from "vitest";

import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  blocksCommunityHintAsEvidence,
  blocksCommunityHintAutoAction,
  detectCommunitySourceReviewAbuseSignals,
  summarizeCommunitySourceReviewAbuseState,
} from "@/features/create/communitySourceReviewModeration";
import {
  clearCommunitySourceReviewHintAbuseSignals,
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewAudits,
  markCommunitySourceReviewHintAsSpamRisk,
  persistCommunitySourceReviewContributionDraft,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
});

describe("community source review abuse spam", () => {
  it("detects repeated, volume and suspicious source signals as moderation hints instead of truth", () => {
    const signals = detectCommunitySourceReviewAbuseSignals({
      kind: "source_suggestion",
      target: "claim",
      relatedContributionCount: 14,
      sourceRefCount: 1,
      sourceRefs: ["http://bit.ly/example"],
      textLength: 28,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: true,
      },
      moderation: null,
    });

    const state = summarizeCommunitySourceReviewAbuseState(signals);

    expect(signals.map((signal) => signal.kind)).toEqual(
      expect.arrayContaining([
        "repeated_submission",
        "excessive_volume_signal",
        "suspicious_source_url",
        "coordinated_activity_signal",
      ]),
    );
    expect(state.evidenceBlocked).toBe(true);
    expect(blocksCommunityHintAutoAction(state)).toBe(true);
    expect(blocksCommunityHintAsEvidence(state)).toBe(true);
    expect(state.summary).toContain("Eskalationssignale");
  });

  it("persists moderator-added spam signals with audit trail and allows clearing them again", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-spam-1",
        kind: "context_note",
        target: "factcheck_request",
        targetId: "factcheck-1",
        text: "Bitte prüfen.",
      }),
    );

    const spamRisk = await markCommunitySourceReviewHintAsSpamRisk({
      contributionId: "community-spam-1",
      actorUserId: "admin-1",
      reason: "Kurzer Linkspam mit unklarem Kontext.",
    });

    expect(spamRisk.contribution.moderation.abuseSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "possible_spam",
          disposition: "hide_until_reviewed",
          detectedFrom: "manual",
        }),
      ]),
    );
    expect(spamRisk.contribution.moderation.moderationStatus).toBe(
      "hidden_pending_review",
    );

    const cleared = await clearCommunitySourceReviewHintAbuseSignals({
      contributionId: "community-spam-1",
      actorUserId: "admin-1",
      reason: "Spam-Risiko erwies sich als legitimer Hinweis.",
    });

    expect(
      cleared.contribution.moderation.abuseSignals.some(
        (signal) => signal.kind === "possible_spam",
      ),
    ).toBe(false);
    expect(cleared.contribution.moderation.moderationStatus).toBe("pending_review");

    const audits = await listCommunitySourceReviewAudits({
      contributionId: "community-spam-1",
      limit: 20,
    });
    expect(audits.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        "signal_reviewed",
        "signal_detected",
        "moderation_action_taken",
      ]),
    );
  });
});
