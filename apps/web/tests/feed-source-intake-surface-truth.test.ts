import { describe, expect, it } from "vitest";
import {
  buildFeedSourceIntakeSurfaceTruth,
  feedSourceIntakeTruthPhaseCopy,
} from "@/features/review/feedSourceIntakeSurfaceTruth";

describe("feed source intake surface truth", () => {
  it("keeps source, material, review and publish labels canonical for admin feeds", () => {
    const truth = buildFeedSourceIntakeSurfaceTruth("admin_feeds");

    expect(truth.title).toBe("Review-first Intake-Handoff");
    expect(truth.phases.map((phase) => phase.label)).toEqual([
      "Source Connection",
      "Material Intake",
      "Review Item",
      "Publish-Vorbereitung",
    ]);
  });

  it("keeps create handoffs separate from publish and automation claims", () => {
    expect(feedSourceIntakeTruthPhaseCopy("create_handoff")).toMatchObject({
      label: "Create-Handoff",
    });
    expect(feedSourceIntakeTruthPhaseCopy("create_handoff").guardrail).toContain(
      "Auto-Publish",
    );
    expect(feedSourceIntakeTruthPhaseCopy("publish_preparation").guardrail).toContain(
      "Auto-Publish",
    );
  });
});
