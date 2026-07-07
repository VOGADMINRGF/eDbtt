import { describe, expect, it } from "vitest";
import {
  CANONICAL_PREPARATION_STATUSES,
  isCanonicalPreparationStatus,
  isCanonicalPublishedStatus,
  resolveCanonicalPublishGuard,
} from "@/features/create/canonicalPreparationStatusContract";

describe("canonical preparation status contract", () => {
  it("keeps publish_ready distinct from published runtime visibility", () => {
    expect(CANONICAL_PREPARATION_STATUSES).toContain("publish_ready");
    expect(isCanonicalPublishedStatus("publish_ready")).toBe(false);
    expect(isCanonicalPublishedStatus("active_or_published")).toBe(true);
  });

  it("blocks public output and publish action without approval", () => {
    expect(
      resolveCanonicalPublishGuard({
        status: "publish_ready",
        approvalGranted: false,
      }),
    ).toEqual({
      autoPublish: false,
      reviewRequired: true,
      publicOutputAllowed: false,
      publishActionEnabled: false,
      externalSocialApiTriggered: false,
    });
  });

  it("allows a publish action after approval without claiming the item is already published", () => {
    expect(
      resolveCanonicalPublishGuard({
        status: "publish_ready",
        approvalGranted: true,
      }),
    ).toEqual({
      autoPublish: false,
      reviewRequired: true,
      publicOutputAllowed: false,
      publishActionEnabled: true,
      externalSocialApiTriggered: false,
    });
  });

  it("keeps public output blocked when blockers remain", () => {
    expect(
      resolveCanonicalPublishGuard({
        status: "active_or_published",
        approvalGranted: true,
        blockers: ["source_missing"],
      }),
    ).toEqual({
      autoPublish: false,
      reviewRequired: true,
      publicOutputAllowed: false,
      publishActionEnabled: false,
      externalSocialApiTriggered: false,
    });
  });

  it("recognizes only the canonical status vocabulary", () => {
    expect(isCanonicalPreparationStatus("review_ready")).toBe(true);
    expect(isCanonicalPreparationStatus("published")).toBe(false);
  });
});
