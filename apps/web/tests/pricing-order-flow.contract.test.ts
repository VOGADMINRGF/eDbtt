import { describe, expect, it } from "vitest";
import {
  canTransitionPricingOrderStatus,
  getInitialOrderStatusForSegment,
  orderStatusRequiresInternalReview,
} from "@features/pricing";

describe("pricing order flow contract", () => {
  it("maps initial status by segment", () => {
    expect(getInitialOrderStatusForSegment("privat")).toBe("submitted");
    expect(getInitialOrderStatusForSegment("journalismus")).toBe("submitted");
    expect(getInitialOrderStatusForSegment("organisationen")).toBe("under_review");
    expect(getInitialOrderStatusForSegment("kommunen")).toBe("under_review");
  });

  it("marks only under_review as explicit review-needed status", () => {
    expect(orderStatusRequiresInternalReview("under_review")).toBe(true);
    expect(orderStatusRequiresInternalReview("submitted")).toBe(false);
    expect(orderStatusRequiresInternalReview("approved")).toBe(false);
  });

  it("guards status transitions", () => {
    expect(canTransitionPricingOrderStatus("under_review", "approved")).toBe(true);
    expect(canTransitionPricingOrderStatus("approved", "active")).toBe(true);
    expect(canTransitionPricingOrderStatus("active", "paused")).toBe(true);
    expect(canTransitionPricingOrderStatus("active", "submitted")).toBe(false);
    expect(canTransitionPricingOrderStatus("rejected", "active")).toBe(false);
    expect(canTransitionPricingOrderStatus("submitted", "submitted")).toBe(true);
  });
});

