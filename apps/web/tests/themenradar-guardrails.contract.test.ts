import { describe, expect, it } from "vitest";
import { createThemenradarShareReadyCandidate } from "@features/themenradar/shareReady";
import type { ThemenradarItem } from "@features/themenradar/contracts";

function makeItem(overrides?: Partial<ThemenradarItem>): ThemenradarItem {
  return {
    id: "themenradar_guardrail_1",
    title: "Verkehrswende Innenstadt",
    rawSignal: "Signal aus News und Community.",
    sourceType: "news",
    heatScore: 80,
    everydayRelevanceScore: 74,
    polarizationScore: 62,
    membershipPotentialScore: 66,
    jurisdiction: "kommune",
    lifecycleStatus: "content_ready",
    linkedAnlassraumId: "65f000000000000000000001",
    linkedDossierId: "verkehrswende-innenstadt",
    campaignKey: "verkehrswende-innenstadt",
    shareContractSnapshot: null,
    telemetrySnapshot: null,
    reviewRequired: true,
    autoPostEligible: false,
    officialSocialRequiresReview: true,
    createdBy: null,
    updatedBy: null,
    lastReviewedBy: null,
    lastReviewedAt: null,
    reviewNotes: [],
    auditVersion: 0,
    archivedAt: null,
    archivedBy: null,
    createdAt: new Date("2026-04-19T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-04-19T10:00:00.000Z").toISOString(),
    ...overrides,
  };
}

describe("themenradar share guardrails", () => {
  it("creates a review-first share-ready candidate without enabling auto posting", () => {
    const result = createThemenradarShareReadyCandidate(makeItem());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shareReady.socialPublication.autoPostEligible).toBe(false);
    expect(result.shareReady.socialPublication.needsReviewBeforeOfficialSocial).toBe(true);
  });

  it("keeps the share-ready candidate parseable and consistent", () => {
    const result = createThemenradarShareReadyCandidate(
      makeItem({ linkedAnlassraumId: null, linkedDossierId: null }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.issues).toEqual([]);
    expect(result.shareReady.guardrails.forbidsAutoOfficialPosting).toBe(true);
    expect(result.shareReady.guardrails.keepsTargetContextSeparatedFromTruth).toBe(true);
  });
});
