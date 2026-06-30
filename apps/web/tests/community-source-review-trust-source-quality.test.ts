import { afterEach, describe, expect, it } from "vitest";

import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  assessCommunitySourceReviewContributionRisk,
  blocksSourceQualityAsVerification,
  blocksTrustAsTruth,
  canPrioritizeCommunityHintForReview,
  getCommunityHintTrustQualityBlockers,
} from "@/features/create/communitySourceReviewModeration";
import {
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewAudits,
  markCommunitySourceReviewSourceQualityReviewed,
  markCommunitySourceReviewTrustQualityReviewed,
  persistCommunitySourceReviewContributionDraft,
  setCommunitySourceReviewPriorityFromTrustQuality,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
});

describe("community source review trust source quality", () => {
  it("derives review-first source quality and trust signals without turning them into truth or verification", () => {
    const strong = assessCommunitySourceReviewContributionRisk({
      kind: "source_suggestion",
      target: "claim",
      relatedContributionCount: 4,
      sourceRefCount: 1,
      sourceRefs: ["https://www.berlin.de/dokument.pdf"],
      textLength: 180,
      claimText: "Primärquelle vom Bezirksamt.",
      notes: [
        "Primärquelle, Beschlussprotokoll vom 2026-06-20.",
        'Zitat: "Die Maßnahme startet im Juli."',
        "Herausgegeben vom Bezirksamt Reinickendorf.",
      ],
      moderationFlags: {
        verifiesClaim: false,
        marksSourceConfirmed: false,
        requestsPublish: false,
        requestsAutoMerge: false,
        requestsRuntimeEntity: false,
        usesMajorityAsTruth: false,
      },
      moderation: {
        trustLevel: "high",
      },
    });

    expect(strong.sourceQualitySignals.map((signal) => signal.kind)).toEqual(
      expect.arrayContaining([
        "source_url_present",
        "primary_source_claimed",
        "document_type_provided",
        "date_provided",
        "author_or_publisher_provided",
        "quote_or_excerpt_provided",
        "strong_review_candidate",
      ]),
    );
    expect(strong.sourceQualityLevel).toBe("strong_review_candidate");
    expect(strong.reviewPriority).toBe("prioritized");
    expect(canPrioritizeCommunityHintForReview(strong)).toBe(true);
    expect(blocksSourceQualityAsVerification(strong)).toBe(true);
    expect(blocksTrustAsTruth(strong)).toBe(true);
    expect(strong.guardrails.acceptedHintIsNotFact).toBe(true);
  });

  it("keeps restricted trust and weak quality review-first without auto reject or deletion", () => {
    const restricted = assessCommunitySourceReviewContributionRisk({
      kind: "counter_source",
      target: "factcheck_request",
      relatedContributionCount: 5,
      sourceRefCount: 0,
      sourceRefs: [],
      textLength: 34,
      notes: [],
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

    expect(restricted.trustLevel).toBe("restricted");
    expect(restricted.sourceQualityLevel).toBe("restricted");
    expect(restricted.moderationStatus).toBe("rejected_abuse");
    expect(getCommunityHintTrustQualityBlockers(restricted)).toEqual(
      expect.arrayContaining([
        "trust_restricted_until_reviewed",
        "source_quality_restricted_until_reviewed",
      ]),
    );
    expect(restricted.summary).not.toContain("verifiziert");
  });

  it("documents trust and source quality review actions in audit without creating truth", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-trust-quality-1",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-trust-quality-1",
        claimText: "Originaldokument vom Bezirksamt.",
        text: "Primärquelle: Beschluss vom 2026-06-20. \"Die Umsetzung startet im Juli.\"",
        sourceRefs: ["https://www.berlin.de/beschluss.pdf"],
        relatedContributionCount: 4,
        notes: ["Bezirksamt Reinickendorf"],
      }),
    );

    await setCommunitySourceReviewPriorityFromTrustQuality({
      contributionId: "community-trust-quality-1",
      actorUserId: "admin-1",
      reason: "Starker Review-Kandidat zuerst prüfen.",
    });
    await markCommunitySourceReviewSourceQualityReviewed({
      contributionId: "community-trust-quality-1",
      actorUserId: "admin-1",
      reason: "Quellenqualität wurde geprüft, aber nicht verifiziert.",
    });
    await markCommunitySourceReviewTrustQualityReviewed({
      contributionId: "community-trust-quality-1",
      actorUserId: "admin-1",
      reason: "Trust/Quality nur als Priorisierung bestätigt.",
    });

    const audits = await listCommunitySourceReviewAudits({
      contributionId: "community-trust-quality-1",
      limit: 40,
    });

    expect(audits.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        "trust_signal_derived",
        "source_quality_signal_derived",
        "review_priority_changed",
        "source_quality_reviewed",
        "trust_quality_reviewed",
      ]),
    );
    expect(
      audits.some((entry) => entry.reviewPriority === "prioritized"),
    ).toBe(true);
    expect(
      audits.some((entry) => entry.sourceQualityLevel === "strong_review_candidate"),
    ).toBe(true);
  });
});
