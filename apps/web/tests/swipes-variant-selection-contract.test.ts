import { describe, expect, it } from "vitest";
import { normalizeSwipeVariantSelection, normalizeSwipeVotePayload } from "@/features/swipes/variantSelectionContract";
import type { SwipeVotePayload } from "@/features/swipes/types";

function buildPayload(overrides: Partial<SwipeVotePayload> = {}): SwipeVotePayload {
  return {
    userId: "user-1",
    statementId: "statement-1",
    decision: "agree",
    source: "swipes",
    ...overrides,
  };
}

describe("swipes variant selection contract", () => {
  it("drops variant metadata when no eventuality id exists", () => {
    const normalized = normalizeSwipeVotePayload(
      buildPayload({
        variantWeight: 5,
        variantReason: "  Grund  ",
        variantRankedIds: ["evt-1"],
        excludedEventualityIds: ["evt-2"],
      }),
    );

    expect(normalized.eventualityId).toBeUndefined();
    expect(normalized.variantWeight).toBeUndefined();
    expect(normalized.variantReason).toBeUndefined();
    expect(normalized.variantRankedIds).toBeUndefined();
    expect(normalized.excludedEventualityIds).toBeUndefined();
  });

  it("normalizes ranked and excluded lists without contradictory ids", () => {
    const normalized = normalizeSwipeVariantSelection({
      eventualityId: " evt-2 ",
      variantWeight: 5,
      variantRankedIds: ["evt-1", "evt-2", "evt-1", "evt-3", ""],
      excludedEventualityIds: ["evt-3", "evt-2", "evt-3"],
    });

    expect(normalized.eventualityId).toBe("evt-2");
    expect(normalized.variantWeight).toBe(5);
    expect(normalized.variantRankedIds).toEqual(["evt-1", "evt-2"]);
    expect(normalized.excludedEventualityIds).toEqual(["evt-3"]);
  });

  it("defaults weight to medium for selected eventuality when weight is invalid", () => {
    const normalized = normalizeSwipeVariantSelection({
      eventualityId: "evt-1",
      variantWeight: 9,
    });

    expect(normalized.variantWeight).toBe(3);
  });

  it("accepts string weight values from raw request payloads", () => {
    const normalized = normalizeSwipeVariantSelection({
      eventualityId: "evt-1",
      variantWeight: "5",
    });

    expect(normalized.variantWeight).toBe(5);
  });

  it("trims and length-limits variant reasons", () => {
    const overLimit = ` ${"a".repeat(400)} `;
    const normalized = normalizeSwipeVariantSelection({
      eventualityId: "evt-1",
      variantReason: overLimit,
    });

    expect(normalized.variantReason?.length).toBe(280);
    expect(normalized.variantReason).toBe("a".repeat(280));
  });
});
