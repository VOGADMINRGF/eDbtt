import { describe, expect, it } from "vitest";
import {
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateOutputPackage,
  generateSocialCarouselOutput,
  getSocialPublishingPolicy,
  SOCIAL_DISTRIBUTION_CHANNELS,
} from "@features/outputEngine";

describe("output engine social distribution plan", () => {
  it("contains all supported channels", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);
    const plan = buildSocialDistributionPlan(carousel);

    expect(plan.targets.map((target) => target.channel)).toEqual(SOCIAL_DISTRIBUTION_CHANNELS);
    expect(plan.targets).toHaveLength(11);
  });

  it("keeps website embed configured while external connectors stay blocked by policy", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);
    const plan = buildSocialDistributionPlan(carousel);

    const website = plan.targets.find((target) => target.channel === "website_embed");
    const instagram = plan.targets.find((target) => target.channel === "instagram");

    expect(website?.connectorStatus).toBe("configured");
    expect(instagram?.connectorStatus).toBe("disabled_by_policy");
  });

  it("provides scheduling options and keeps non-realtime defaults", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);
    const plan = buildSocialDistributionPlan(carousel);

    expect(plan.scheduleModes).toEqual([
      "manual",
      "suggested_window",
      "scheduled_at",
      "immediate_after_review",
    ]);
    expect(plan.scheduleMode).toBe("suggested_window");
    expect(plan.publishActionEnabled).toBe(false);
    expect(plan.canAutoPublish).toBe(false);
  });

  it("uses policy defaults with no realtime and no external api publishing", () => {
    const policy = getSocialPublishingPolicy();
    expect(policy.canRealtimePublish).toBe(false);
    expect(policy.autoPublishEnabled).toBe(false);
    expect(policy.externalApisEnabled).toBe(false);
    expect(policy.requiresManualReview).toBe(true);
  });

  it("keeps suggested post metadata visible for studio planning", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);
    const plan = buildSocialDistributionPlan(carousel);

    expect(plan.suggestedPostText.length).toBeGreaterThan(20);
    expect(plan.suggestedHashtags).toContain("#eDebatte");
    expect(plan.suggestedPostingWindows.length).toBeGreaterThan(0);
  });
});
