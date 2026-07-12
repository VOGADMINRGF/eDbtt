import { describe, expect, it } from "vitest";
import {
  PRODUCTION_ENTRY_COPY,
  PRODUCTION_ENTRY_PATHS,
  isOrganizationAccessBlocked,
  isOrganizationAccessLimited,
  isOrganizationVerificationPending,
  resolveRegisterBridgeForProductionEntry,
} from "@/features/access/productionEntryContract";

describe("production entry contract", () => {
  it("keeps direct-start copy anchored on account, organization and canonical order paths", () => {
    expect(PRODUCTION_ENTRY_COPY.loginRegisterHint).toContain("anmelden");
    expect(PRODUCTION_ENTRY_COPY.loginRegisterHint).toContain("registrieren");
    expect(PRODUCTION_ENTRY_COPY.organizationPathHint).toContain(PRODUCTION_ENTRY_PATHS.legacyOrderFallback);
    expect(PRODUCTION_ENTRY_COPY.organizationPathHint).toContain("Bestandslink/Fallback");
  });

  it("routes pricing/order register bridges without turning legacy paths into the main funnel", () => {
    const orderBridge = resolveRegisterBridgeForProductionEntry("/order?paket=b2g_basis");
    const legacyBridge = resolveRegisterBridgeForProductionEntry("/vormerken?segment=kommunen");

    expect(orderBridge?.text).toContain(PRODUCTION_ENTRY_PATHS.directOrder);
    expect(orderBridge?.text).toContain("direkten Paketpfad");
    expect(legacyBridge?.text).toContain(PRODUCTION_ENTRY_PATHS.legacyOrderFallback);
    expect(legacyBridge?.text).toContain(PRODUCTION_ENTRY_PATHS.directOrder);
  });

  it("shares the same blocked, pending and limited access semantics across surfaces", () => {
    expect(
      isOrganizationAccessBlocked({
        provisioningStatus: "approved",
        contractStatus: "active",
        billingStatus: "none",
        entitlementStatus: "revoked",
      }),
    ).toBe(true);

    expect(
      isOrganizationVerificationPending({
        verificationStatus: "pending_review",
        hasOrganizationSignal: true,
      }),
    ).toBe(true);

    expect(
      isOrganizationAccessLimited({
        provisioningStatus: "approved",
        contractStatus: "active",
        billingStatus: "billing_pending",
        entitlementStatus: "granted",
      }),
    ).toBe(true);
  });
});
