import { describe, expect, it } from "vitest";
import { resolveSwipesProgressState } from "@/features/surfaces/swipes/progressContract";

describe("swipes progress contract", () => {
  it("stays idle when no active swipe target exists", () => {
    const state = resolveSwipesProgressState({
      swipeCount: 0,
      decisionCount: 0,
      fromDraftMode: false,
    });

    expect(state.mode).toBe("idle");
    expect(state.swipeCount).toBe(0);
  });

  it("switches to active once real interaction exists", () => {
    expect(
      resolveSwipesProgressState({
        swipeCount: 1,
        decisionCount: 0,
        fromDraftMode: false,
      }).mode,
    ).toBe("active");
    expect(
      resolveSwipesProgressState({
        swipeCount: 0,
        decisionCount: 1,
        fromDraftMode: false,
      }).mode,
    ).toBe("active");
    expect(
      resolveSwipesProgressState({
        swipeCount: 0,
        decisionCount: 0,
        fromDraftMode: true,
      }).mode,
    ).toBe("active");
  });
});
