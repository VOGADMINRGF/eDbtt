import { describe, expect, it } from "vitest";
import {
  SOCIAL_DISTRIBUTION_CHANNELS,
  buildSocialDistributionDraft,
  buildSocialDistributionPlan,
  buildSocialDistributionQueue,
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

  it("keeps internal draft channels available and external social drafts gated by policy", () => {
    const plan = buildPlan();

    const website = plan.targets.find((target) => target.channel === "website_update");
    const instagram = plan.targets.find((target) => target.channel === "instagram_asset");

    expect(website?.connectorStatus).toBe("internal_available");
    expect(["requires_review", "disabled_by_policy", "configured"]).toContain(instagram?.connectorStatus);
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
    expect(plan.channelVersions.length).toBeGreaterThanOrEqual(7);
    expect(plan.channelVersions.some((entry) => entry.title.includes("Pressenotiz"))).toBe(true);
  });

  it("keeps policy defaults with no external API publishing", () => {
    const policy = getSocialPublishingPolicy();

    expect(policy.externalApisEnabled).toBe(false);
    expect(policy.autoPublishEnabled).toBe(false);
    expect(policy.canRealtimePublish).toBe(false);
    expect(policy.requiresManualReview).toBe(true);
  });

  it("builds a deterministic queue for selected channels", () => {
    const plan = buildPlan();
    const queue = buildSocialDistributionQueue(plan, ["website_update", "linkedin_draft"]);

    expect(queue).toHaveLength(2);
    expect(queue[0]?.channel).toBe("website_update");
    expect(queue[1]?.channel).toBe("linkedin_draft");
    expect(queue.every((entry) => entry.recommendedWindow.length > 0)).toBe(true);
  });

  it("creates a persistent draft contract for manual handoff without external publish", () => {
    const plan = buildPlan();
    const draft = buildSocialDistributionDraft({
      plan,
      selectedChannels: ["website_update", "linkedin_draft"],
      scheduleMode: "suggested_window",
      reviewRequired: true,
      status: "review_required",
      savedAt: "2026-04-30T10:30:00.000Z",
    });

    expect(draft.dossierId).toBe(plan.dossierId);
    expect(draft.status).toBe("review_required");
    expect(draft.externalPublish).toBe(false);
    expect(draft.queue.length).toBeGreaterThan(0);
    expect(draft.notes.some((entry) => entry.includes("Keine externe Live-Veröffentlichung"))).toBe(true);
  });
});
