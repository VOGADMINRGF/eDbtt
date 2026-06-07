import { describe, expect, it } from "vitest";
import {
  getEditorialReviewFactcheckStatusLabel,
  resolveFactcheckEntitlementGate,
} from "@features/factcheck/entitlementGate";

describe("factcheck entitlement gate", () => {
  it("keeps light analysis free and ungated", () => {
    const gate = resolveFactcheckEntitlementGate("light_analysis", {
      isAuthenticated: false,
    });

    expect(gate).toMatchObject({
      action: "light_analysis",
      allowed: true,
      loginRequired: false,
      entitlementRequired: false,
      pricingRequired: false,
      confirmationRequired: false,
      noAutoStart: true,
      noSilentCost: true,
    });
  });

  it("requires login for factcheck requests", () => {
    const gate = resolveFactcheckEntitlementGate("factcheck_request", {
      isAuthenticated: false,
    });

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("login_required");
  });

  it("requires entitlement and confirmation for deep research", () => {
    const gate = resolveFactcheckEntitlementGate("deep_research", {
      isAuthenticated: true,
      hasEntitlement: true,
      hasPricingAccess: true,
      confirmationProvided: false,
    });

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("confirmation_required");

    const confirmed = resolveFactcheckEntitlementGate("deep_research", {
      isAuthenticated: true,
      hasEntitlement: true,
      hasPricingAccess: true,
      confirmationProvided: true,
    });
    expect(confirmed.allowed).toBe(true);
  });

  it("maps factcheck review queue states to request or preparation language", () => {
    expect(
      getEditorialReviewFactcheckStatusLabel({
        sourceType: "factcheck_request",
        status: "pending_review",
      }),
    ).toBe("Quellenprüfung angefragt");
    expect(
      getEditorialReviewFactcheckStatusLabel({
        sourceType: "factcheck_request",
        status: "accepted_for_workup",
      }),
    ).toBe("Quellenprüfung vorbereitet");
  });
});
