import { describe, expect, it } from "vitest";
import {
  SOCIAL_DISTRIBUTION_CHANNELS,
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
  generateSocialCarouselOutput,
  getSocialPublishingPolicy,
} from "@features/outputEngine";

describe("output engine social distribution plan", () => {
  function buildPlan() {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);
    const masterPost = generateMasterPost(pkg);
    return buildSocialDistributionPlan(masterPost, carousel);
  }

  it("contains all channels for distribution planning", () => {
    const plan = buildPlan();

    expect(plan.targets.map((target) => target.channel)).toEqual(SOCIAL_DISTRIBUTION_CHANNELS);
    expect(plan.targets).toHaveLength(SOCIAL_DISTRIBUTION_CHANNELS.length);
  });

  it("keeps website embed internally available and external channels blocked or unconnected by default", () => {
    const plan = buildPlan();

    const website = plan.targets.find((target) => target.channel === "website_embed");
    const instagram = plan.targets.find((target) => target.channel === "instagram");

    expect(website?.connectorStatus).toBe("internal_available");
    expect(["not_connected", "disabled_by_policy"]).toContain(instagram?.connectorStatus);
  });

  it("provides scheduling options and keeps non-realtime defaults", () => {
    const plan = buildPlan();

    expect(plan.scheduleModes).toEqual([
      "manual",
      "suggested_window",
      "scheduled_at",
      "immediate_after_review",
    ]);
    expect(plan.scheduleMode).toBe("suggested_window");
    expect(plan.canAutoPublish).toBe(false);
    expect(plan.canRealtimePublish).toBe(false);
    expect(plan.externalApisUsed).toBe(false);
  });

  it("exposes post text, hashtags and posting windows for channel planning", () => {
    const plan = buildPlan();

    expect(plan.suggestedPostText.length).toBeGreaterThan(20);
    expect(plan.suggestedHashtags).toContain("#eDebatte");
    expect(plan.suggestedPostingWindows.length).toBeGreaterThan(0);
  });

  it("keeps policy defaults with no external API publishing", () => {
    const policy = getSocialPublishingPolicy();

    expect(policy.externalApisEnabled).toBe(false);
    expect(policy.autoPublishEnabled).toBe(false);
    expect(policy.canRealtimePublish).toBe(false);
    expect(policy.requiresManualReview).toBe(true);
  });
});
