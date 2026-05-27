import { describe, expect, it } from "vitest";
import {
  CheckoutSessionSchema,
  deriveBillingStatusFromCheckoutSession,
} from "@features/pricing";

describe("payment-checkout-session.contract", () => {
  it("parses checkout sessions with explicit return and cancel targets", () => {
    const session = CheckoutSessionSchema.parse({
      id: "checkout-1",
      planId: "b2b_basis",
      organizationId: "org-1",
      userId: "user-1",
      amount: 4900,
      currency: "EUR",
      status: "checkout_pending",
      providerSessionId: null,
      returnUrl: "/account/organization/dashboard",
      cancelUrl: "/pricing/institutionen",
    });

    expect(session.status).toBe("checkout_pending");
    expect(deriveBillingStatusFromCheckoutSession(session)).toBe("checkout_pending");
  });

  it("maps paid and failed checkout sessions to billing truth without inventing publication rights", () => {
    expect(
      deriveBillingStatusFromCheckoutSession({
        status: "paid",
      }),
    ).toBe("paid");
    expect(
      deriveBillingStatusFromCheckoutSession({
        status: "failed",
      }),
    ).toBe("failed");
  });
});
