import { describe, expect, it } from "vitest";
import {
  organizationProvisioningStatusLabel,
  organizationVerificationStatusLabel,
  regionEntitlementStatusLabel,
  regionEntitlementReasonLabel,
  regionFeedSignalOriginLabel,
  regionGuardrailLabel,
  regionOpenReviewOriginLabel,
  regionReviewStatusLabel,
  regionVisibilityStateLabel,
} from "@features/region";
import { organizationBillingSourceLabel } from "@features/pricing";
import { getOperatorWorkbenchSurface } from "@/features/admin/operatorWorkbenchSurfaces";

describe("operator workbench labels", () => {
  it("keeps operator access and contract labels canonical across admin and organization surfaces", () => {
    expect(organizationVerificationStatusLabel("organization_verified")).toBe(
      "Organisations-verifiziert",
    );
    expect(organizationProvisioningStatusLabel("operator_review_required")).toBe(
      "Betreiberprüfung läuft",
    );
    expect(organizationBillingSourceLabel("operator_verified_contract")).toBe(
      "Betreiber-verifizierter Vertragsprozess",
    );
    expect(regionEntitlementStatusLabel("active")).toBe("Aktiv");
    expect(regionEntitlementReasonLabel("missing_entitlement")).toBe(
      "Verifizierte Membership vorhanden, aber Freischaltung fehlt.",
    );
  });

  it("keeps region review and guardrail wording on human-readable operator language", () => {
    expect(regionReviewStatusLabel("needs_review")).toBe("Review erforderlich");
    expect(regionVisibilityStateLabel("internal_review")).toBe("Intern in Prüfung");
    expect(regionFeedSignalOriginLabel("pilot_fixture")).toBe(
      "Pilotvorschau · kuratierte Startlage · keine Produktionsdaten",
    );
    expect(regionOpenReviewOriginLabel(false)).toBe("Review aus aktiver Quelle");
    expect(regionGuardrailLabel("noAutoPublish")).toBe("Kein Auto-Publish");
  });

  it("keeps the central operator surfaces on real routes", () => {
    expect(getOperatorWorkbenchSurface("reviewQueue")).toMatchObject({
      href: "/admin/review",
      title: "Review Queue",
    });
    expect(getOperatorWorkbenchSurface("pricingOrders")).toMatchObject({
      href: "/admin/pricing/orders",
      title: "Pricing Orders",
    });
    expect(getOperatorWorkbenchSurface("organizationDashboard")).toMatchObject({
      href: "/account/organization/dashboard",
      title: "Organisationsbereich",
    });
  });
});
