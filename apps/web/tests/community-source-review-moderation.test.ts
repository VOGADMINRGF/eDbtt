import { afterEach, describe, expect, it } from "vitest";

import {
  assessCommunitySourceReviewContributionRisk,
  canEscalateCommunityContributionToEditorial,
  canExposeCommunityContributionPublicly,
  getCommunitySourceReviewModerationBlockers,
  shouldRequireHumanModeration,
  summarizeCommunityContributionModerationState,
} from "@/features/create/communitySourceReviewModeration";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  allowCommunitySourceReviewHint,
  createInMemoryCommunitySourceReviewRepository,
  escalateCommunitySourceReviewHint,
  getCommunitySourceReviewRecord,
  hideCommunitySourceReviewHint,
  markCommunitySourceReviewHintNeedsEditorialReview,
  markCommunitySourceReviewHintNeedsSourceReview,
  persistCommunitySourceReviewContributionDraft,
  rejectCommunitySourceReviewHint,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
});

describe("community source review moderation", () => {
  it("starts new safe hints review-first instead of treating them as public truth", () => {
    const signal = assessCommunitySourceReviewContributionRisk({
      kind: "source_suggestion",
      target: "claim",
      relatedContributionCount: 0,
      sourceRefCount: 1,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
    });

    expect(signal.moderationStatus).toBe("pending_review");
    expect(shouldRequireHumanModeration(signal)).toBe(true);
    expect(canExposeCommunityContributionPublicly(signal)).toBe(false);
    expect(signal.guardrails.trustDoesNotVerifyTruth).toBe(true);
    expect(signal.guardrails.sourceSuggestionIsNotConfirmedSource).toBe(true);
  });

  it("blocks spam, personal data and off-topic hints through moderation blockers", () => {
    const spam = assessCommunitySourceReviewContributionRisk({
      kind: "context_note",
      target: "factcheck_request",
      relatedContributionCount: 1,
      sourceRefCount: 0,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        abuseReasons: ["spam"],
      },
    });
    const personalData = assessCommunitySourceReviewContributionRisk({
      kind: "lived_experience",
      target: "source_question",
      relatedContributionCount: 1,
      sourceRefCount: 0,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        abuseReasons: ["personal_data"],
      },
    });
    const offTopic = assessCommunitySourceReviewContributionRisk({
      kind: "wording_clarification",
      target: "claim",
      relatedContributionCount: 0,
      sourceRefCount: 0,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        abuseReasons: ["off_topic"],
      },
    });

    expect(spam.moderationStatus).toBe("rejected_abuse");
    expect(getCommunitySourceReviewModerationBlockers(spam)).toEqual(
      expect.arrayContaining(["abuse_spam", "rejected_abuse"]),
    );
    expect(personalData.moderationStatus).toBe("hidden_pending_review");
    expect(getCommunitySourceReviewModerationBlockers(personalData)).toEqual(
      expect.arrayContaining(["abuse_personal_data", "hidden_pending_review"]),
    );
    expect(offTopic.moderationStatus).toBe("needs_moderation");
    expect(getCommunitySourceReviewModerationBlockers(offTopic)).toContain(
      "abuse_off_topic",
    );
  });

  it("lets trust prioritize review at most and never imply verified truth", () => {
    const signal = assessCommunitySourceReviewContributionRisk({
      kind: "source_suggestion",
      target: "factcheck_request",
      relatedContributionCount: 2,
      sourceRefCount: 2,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        trustLevel: "trusted_contributor",
      },
    });

    expect(signal.reviewPriority).toBe("prioritized");
    expect(signal.guardrails.trustDoesNotVerifyTruth).toBe(true);
    expect(signal.summary).toContain("bestätigt keine Wahrheit");
    expect(canExposeCommunityContributionPublicly(signal)).toBe(false);
  });

  it("keeps volume, accepted hints and lived experience separate from truth or representative evidence", () => {
    const manyHints = assessCommunitySourceReviewContributionRisk({
      kind: "lived_experience",
      target: "source_question",
      relatedContributionCount: 24,
      sourceRefCount: 0,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        moderationStatus: "allowed_as_hint",
      },
    });

    expect(manyHints.guardrails.volumeDoesNotVerifyTruth).toBe(true);
    expect(manyHints.guardrails.acceptedHintIsNotFact).toBe(true);
    expect(manyHints.guardrails.livedExperienceIsNotRepresentativeEvidence).toBe(true);
    expect(canExposeCommunityContributionPublicly(manyHints)).toBe(true);
    expect(summarizeCommunityContributionModerationState(manyHints)).toContain(
      "nicht als bestätigte Wahrheit",
    );
  });

  it("escalates misleading or unverifiable source conflicts to editorial review without claiming automatic disproof", () => {
    const signal = assessCommunitySourceReviewContributionRisk({
      kind: "counter_source",
      target: "factcheck_request",
      relatedContributionCount: 3,
      sourceRefCount: 1,
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        abuseReasons: ["misleading_source", "unverifiable_claim"],
      },
    });

    expect(canEscalateCommunityContributionToEditorial(signal)).toBe(true);
    expect(signal.guardrails.counterSourceIsNotAutomaticDisproof).toBe(true);
    expect(signal.moderationStatus).toBe("needs_moderation");
  });

  it("supports explicit admin moderation decisions without turning hints into facts", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-hint-1",
        kind: "source_suggestion",
        target: "factcheck_request",
        targetId: "factcheck-1",
        text: "Hier ist ein zusätzlicher Quellenhinweis.",
        sourceRefs: ["https://beispiel.de/quelle"],
        moderation: {
          trustLevel: "trusted_contributor",
        },
      }),
    );

    const allowed = await allowCommunitySourceReviewHint({
      contributionId: "community-hint-1",
      actorUserId: "admin-1",
      reason: "Als prüfbaren Hinweis markieren.",
    });
    expect(allowed.decisionStatus).toBe("allowed_as_hint");
    expect(allowed.contribution.status).toBe("accepted_as_hint");
    expect(allowed.contribution.guardrails.acceptedHintIsFact).toBe(false);

    const routedToSourceReview = await markCommunitySourceReviewHintNeedsSourceReview({
      contributionId: "community-hint-1",
      actorUserId: "admin-1",
      reason: "Zur Quellenprüfung vormerken.",
    });
    expect(routedToSourceReview.routeTarget).toBe("source_review");
    expect(routedToSourceReview.contribution.guardrails.canConfirmSource).toBe(false);

    const escalated = await escalateCommunitySourceReviewHint({
      contributionId: "community-hint-1",
      actorUserId: "admin-1",
      reason: "Erfordert redaktionelle Priorisierung.",
    });
    expect(escalated.decisionStatus).toBe("escalated");
    expect(escalated.contribution.moderation.reviewPriority).toBe("prioritized");

    const routedToEditorial = await markCommunitySourceReviewHintNeedsEditorialReview({
      contributionId: "community-hint-1",
      actorUserId: "admin-1",
      reason: "Zur Redaktion legen.",
    });
    expect(routedToEditorial.routeTarget).toBe("editorial_review");
    expect(routedToEditorial.contribution.guardrails.canPublish).toBe(false);

    const hidden = await hideCommunitySourceReviewHint({
      contributionId: "community-hint-1",
      actorUserId: "admin-1",
      reason: "Bis zur weiteren Prüfung ausblenden.",
    });
    expect(hidden.decisionStatus).toBe("hidden");
    expect(hidden.blockers).toContain("hidden_hint");
    expect(hidden.contribution.guardrails.hiddenOrRejectedCountsAsEvidence).toBe(false);

    const rejected = await rejectCommunitySourceReviewHint({
      contributionId: "community-hint-1",
      actorUserId: "admin-1",
      reason: "Nicht als belastbarer Review-Hinweis nutzbar.",
    });
    expect(rejected.decisionStatus).toBe("rejected");
    expect(rejected.blockers).toContain("rejected_hint");

    const persisted = await getCommunitySourceReviewRecord("community-hint-1");
    expect(persisted?.decisionStatus).toBe("rejected");
    expect(persisted?.contribution.guardrails.canAutoMerge).toBe(false);
    expect(persisted?.contribution.guardrails.canCreateRuntimeEntity).toBe(false);
  });
});
