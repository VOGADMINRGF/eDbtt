import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createInMemoryCheckoutSessionsRepo,
  setCheckoutSessionsRepoForTests,
} from "@features/pricing/server/checkoutSessionsRepo";
import {
  createInMemoryRegionEntitlementRuntimeRepo,
  setRegionEntitlementRuntimeRepoForTests,
} from "@features/region";

describe("payment-entitlement-after-checkout.contract", () => {
  afterEach(() => {
    setCheckoutSessionsRepoForTests(null);
    setRegionEntitlementRuntimeRepoForTests(null);
  });

  it("grants only scoped paid entitlements after checkout and writes audit events", async () => {
    const checkoutRepo = createInMemoryCheckoutSessionsRepo();
    const entitlementRepo = createInMemoryRegionEntitlementRuntimeRepo();
    setCheckoutSessionsRepoForTests(checkoutRepo);
    setRegionEntitlementRuntimeRepoForTests(entitlementRepo);

    const session = await checkoutRepo.createCheckoutSession({
      provider: "stripe",
      planId: "b2b_basis",
      organizationId: "org-1",
      userId: "user-1",
      amount: 4900,
      currency: "EUR",
      returnUrl: "/account/organization/dashboard",
      cancelUrl: "/pricing/institutionen",
    });

    const completed = await checkoutRepo.completeCheckoutSession({
      sessionId: session.id,
      actorUserId: "admin-1",
      status: "paid",
      organizationName: "Beteiligungsbüro Test",
      organizationType: "association",
      regionId: "region-1",
    });

    const entitlements = await entitlementRepo.getEntitlementsForOrganization("org-1");
    const auditEvents = await entitlementRepo.listEntitlementAuditEventsForOrganization("org-1");

    expect(completed?.status).toBe("paid");
    expect(completed?.auditEvents.some((event) => event.eventType === "entitlement_granted")).toBe(true);
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({
      organizationId: "org-1",
      status: "active",
      source: "external_checkout",
      scope: "organization",
    });
    expect(auditEvents).toHaveLength(1);
    expect(completed?.auditEvents.at(-1)?.note).toContain("Kein public_official");
    expect(completed?.auditEvents.at(-1)?.note).toContain("keine publication_approved-Freigabe");
  });
});
