import { describe, expect, it } from "vitest";
import {
  buildUserContributionLifecycleRecord,
  getNextUserContributionLifecycleStatuses,
} from "@/features/create/userContributionLifecycleContract";

describe("user contribution lifecycle contract", () => {
  it("tracks contribution to format recommendation without losing visibility", () => {
    const record = buildUserContributionLifecycleRecord({
      contributionId: "c1",
      linkedTopicId: "topic-1",
      sourcePresent: true,
      formatRecommendation: "poll",
    });

    expect(record.status).toBe("format_recommended");
    expect(record.publicVisible).toBe(false);
    expect(record.visibleOutcome).toContain("Formatvorschlag: poll");
  });

  it("keeps clarification and source-needed paths explicit", () => {
    expect(
      buildUserContributionLifecycleRecord({
        contributionId: "c2",
        clarificationNeeded: true,
      }).status,
    ).toBe("needs_clarification");

    expect(
      buildUserContributionLifecycleRecord({
        contributionId: "c3",
        sourcePresent: false,
      }).status,
    ).toBe("source_needed");
  });

  it("distinguishes publish-ready from activated visibility", () => {
    expect(
      buildUserContributionLifecycleRecord({
        contributionId: "c4",
        reviewApproved: true,
      }).status,
    ).toBe("publish_ready");

    const published = buildUserContributionLifecycleRecord({
      contributionId: "c5",
      published: true,
    });
    expect(published.status).toBe("activated_or_published");
    expect(published.publicVisible).toBe(true);
  });

  it("keeps transition graph review-first", () => {
    expect(getNextUserContributionLifecycleStatuses("format_recommended")).toEqual(
      ["review_ready", "needs_clarification", "archived"],
    );
  });
});
