import { describe, expect, it } from "vitest";
import { applySwipeForCredits } from "@/config/credits";
import { normalizeAccessTier } from "@/config/accessTiers";
import {
  canUserCreateCampaign,
  canUserCreateStream,
  canUserHostStream,
  canUserSwipe,
} from "@/utils/accessTiers";

describe("access controls", () => {
  it("maps legacy tiers to canonical tiers", () => {
    expect(normalizeAccessTier("citizenBasic")).toBe("basis");
    expect(normalizeAccessTier("citizenPremium")).toBe("erweitert");
    expect(normalizeAccessTier("citizenPro")).toBe("premium");
  });

  it("applies swipe credit progression and cap", () => {
    expect(applySwipeForCredits({ swipeCountTotal: 99, creditsAvailable: 0 })).toEqual({
      swipeCountTotal: 100,
      creditsAvailable: 1,
    });

    expect(applySwipeForCredits({ swipeCountTotal: 10_000, creditsAvailable: 50 })).toEqual({
      swipeCountTotal: 10_001,
      creditsAvailable: 50,
    });
  });

  it("respects stream and campaign gates", () => {
    expect(canUserSwipe({ accessTier: "institutionBasic" })).toBe(false);

    expect(canUserCreateStream({ accessTier: "erweitert", engagementLevel: "Engagiert" })).toBe(false);
    expect(canUserCreateStream({ accessTier: "erweitert", engagementLevel: "Brennend" })).toBe(true);

    expect(canUserHostStream({ accessTier: "erweitert", engagementLevel: "Brennend" })).toBe(false);
    expect(canUserHostStream({ accessTier: "erweitert", engagementLevel: "Inspirierend" })).toBe(true);

    expect(canUserCreateCampaign({ accessTier: "basis" })).toBe(false);
    expect(canUserCreateCampaign({ accessTier: "premium" })).toBe(true);
  });
});
