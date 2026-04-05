import { describe, expect, it } from "vitest";
import { resolveSwipeGestureDecision } from "@/features/surfaces/swipes/gestureContract";

describe("swipes gesture contract", () => {
  it("rejects tiny drags to avoid accidental votes", () => {
    const decision = resolveSwipeGestureDecision({
      dx: 28,
      dy: 4,
      cardWidth: 360,
      durationMs: 220,
    });
    expect(decision).toBeNull();
  });

  it("rejects gestures with dominant vertical movement", () => {
    const decision = resolveSwipeGestureDecision({
      dx: 90,
      dy: 88,
      cardWidth: 360,
      durationMs: 180,
    });
    expect(decision).toBeNull();
  });

  it("accepts deliberate horizontal drag for agree/disagree", () => {
    expect(
      resolveSwipeGestureDecision({
        dx: 140,
        dy: 18,
        cardWidth: 360,
        durationMs: 260,
      }),
    ).toBe("agree");

    expect(
      resolveSwipeGestureDecision({
        dx: -136,
        dy: 14,
        cardWidth: 360,
        durationMs: 250,
      }),
    ).toBe("disagree");
  });

  it("accepts fast flicks with clear horizontal intent", () => {
    const decision = resolveSwipeGestureDecision({
      dx: 54,
      dy: 6,
      cardWidth: 360,
      durationMs: 70,
    });
    expect(decision).toBe("agree");
  });
});
