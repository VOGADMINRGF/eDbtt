import { describe, expect, it } from "vitest";
import { resolveShareReadyAssetContract } from "@features/anlassraum/shareReadyAssetContract";
import { buildThemenradarShareDistributionHandoff } from "@features/themenradar/shareDistribution";

function shareReadyFixture() {
  return resolveShareReadyAssetContract({
    anlassraumId: "anlass_123",
    dossierId: "dossier_123",
    title: "Innenstadtverkehr und Lieferzonen",
    summary: "Kommunale Hinweise aus Handel, Anwohnenden und Mobilitätsausschuss.",
    lifecycleStatus: "published",
    outputStatus: "review",
    isPublic: true,
  });
}

describe("themenradar share distribution handoff contract", () => {
  it("keeps manual review-first handoff between Themenradar, Studio and export relay", () => {
    const handoff = buildThemenradarShareDistributionHandoff({
      item: {
        id: "thema_42",
        title: "Innenstadtverkehr und Lieferzonen",
        rawSignal: "Signal",
        sourceType: "news",
        heatScore: 70,
        everydayRelevanceScore: 68,
        polarizationScore: 52,
        membershipPotentialScore: 61,
        jurisdiction: "kommune",
        lifecycleStatus: "review_ready",
        linkedAnlassraumId: "anlass_123",
        linkedDossierId: "dossier_123",
        campaignKey: "innenstadt-logistik",
        reviewRequired: true,
        autoPostEligible: false,
        officialSocialRequiresReview: true,
        createdBy: null,
        updatedBy: null,
        lastReviewedBy: null,
        lastReviewedAt: null,
        reviewNotes: [],
        auditVersion: 1,
        archivedAt: null,
        archivedBy: null,
        createdAt: "2026-05-03T10:00:00.000Z",
        updatedAt: "2026-05-03T10:00:00.000Z",
      },
      format: "carousel",
      shareReady: shareReadyFixture(),
    });

    expect(handoff.guardrails.manualReleaseOnly).toBe(true);
    expect(handoff.guardrails.reviewRequired).toBe(true);
    expect(handoff.guardrails.externalAutopostAllowed).toBe(false);
    expect(handoff.guardrails.thirdPartyUserIdsAllowed).toBe(false);
    expect(handoff.guardrails.thirdPartyBeaconsAllowed).toBe(false);

    expect(handoff.targets.themenradarAdmin).toBe("/admin/themenradar/thema_42");
    expect(handoff.targets.dossierStudio).toBe("/dossier/dossier_123/studio");
    expect(handoff.targets.canonicalPublicTarget.length).toBeGreaterThan(0);
    expect(handoff.targets.qrTarget.length).toBeGreaterThan(0);

    expect(handoff.exportRelay.route).toBe("/api/admin/themenradar/thema_42/export");
    expect(handoff.exportRelay.format).toBe("carousel");
    expect(handoff.exportRelay.allowedFormats).toEqual(["post", "carousel", "script"]);
    expect(handoff.routeFlow).toEqual([
      "themenradar_admin",
      "dossier_studio",
      "share_export_manual",
    ]);
  });

  it("rejects handoff creation when share-ready guardrails drift", () => {
    const shareReady = shareReadyFixture();
    const driftedShareReady = {
      ...shareReady,
      socialPublication: {
        ...shareReady.socialPublication,
        autoPostEligible: true as const,
      },
    };

    expect(() =>
      buildThemenradarShareDistributionHandoff({
        item: {
          id: "thema_43",
          title: "Test",
          rawSignal: "Signal",
          sourceType: "manual",
          heatScore: 30,
          everydayRelevanceScore: 30,
          polarizationScore: 30,
          membershipPotentialScore: 30,
          jurisdiction: "mixed",
          lifecycleStatus: "review_ready",
          linkedAnlassraumId: null,
          linkedDossierId: null,
          campaignKey: null,
          reviewRequired: true,
          autoPostEligible: false,
          officialSocialRequiresReview: true,
          createdBy: null,
          updatedBy: null,
          lastReviewedBy: null,
          lastReviewedAt: null,
          reviewNotes: [],
          auditVersion: 1,
          archivedAt: null,
          archivedBy: null,
          createdAt: "2026-05-03T10:00:00.000Z",
          updatedAt: "2026-05-03T10:00:00.000Z",
        },
        format: "post",
        shareReady: driftedShareReady,
      }),
    ).toThrow("share_distribution_auto_post_must_stay_false");
  });
});
