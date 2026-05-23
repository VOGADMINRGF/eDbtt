import { describe, expect, it } from "vitest";
import {
  buildAdminPricingControlAuditFields,
  parseAdminPricingControlPolicyContract,
} from "@/lib/server/pricing/adminPricingControlContract";
import { isProductionBillingTruth } from "@features/pricing";

function baseExplainability() {
  return {
    segment: {
      factors: ["segment", "verification_status"],
      note: "Segment folgt dem freigegebenen Rollen-/Verifizierungsprofil.",
    },
    plan: {
      factors: ["plan", "creator_type"],
      note: "Plan folgt Segment und Creator-Typ.",
    },
    fee: {
      factors: ["funding_fee_rule", "cap_policy"],
      note: "Fee-/Cap-Regeln folgen dem Pricing-Kanon.",
    },
    specialStatus: {
      factors: ["special_offer_status", "pilot_status", "policy_source"],
      note: "Sonderstatus ist transparent und auditierbar.",
    },
  } as const;
}

describe("admin pricing control contract", () => {
  it("accepts a valid civic creator contract", () => {
    const parsed = parseAdminPricingControlPolicyContract({
      segment: "civic_creator",
      creatorType: "civic",
      verificationStatus: "verified",
      pricingPlanKind: "professional_creator",
      institutionType: "none",
      publicEntityFlag: false,
      feeRuleType: "standard",
      capPolicyType: "protected_civic_corridor",
      overrideType: "none",
      specialOfferStatus: "none",
      pilotStatus: "none",
      source: "policy_default",
      explainability: baseExplainability(),
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.segment).toBe("civic_creator");
  });

  it("rejects unknown/forbidden fields in strict contract parsing", () => {
    const parsed = parseAdminPricingControlPolicyContract({
      segment: "civic_creator",
      creatorType: "civic",
      verificationStatus: "verified",
      pricingPlanKind: "professional_creator",
      institutionType: "none",
      publicEntityFlag: false,
      feeRuleType: "standard",
      capPolicyType: "default_caps",
      overrideType: "none",
      specialOfferStatus: "none",
      pilotStatus: "none",
      source: "policy_default",
      explainability: baseExplainability(),
      truthScoreMultiplier: 2,
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.includes("Unrecognized key") || issue.includes("root"))).toBe(true);
  });

  it("requires municipal path to be verified and institution-bound", () => {
    const parsed = parseAdminPricingControlPolicyContract({
      segment: "municipality_public",
      creatorType: "publisher_agency",
      verificationStatus: "pending",
      pricingPlanKind: "professional_municipality",
      institutionType: "none",
      publicEntityFlag: false,
      feeRuleType: "municipal_verified_corridor",
      capPolicyType: "municipal_corridor",
      overrideType: "none",
      specialOfferStatus: "none",
      pilotStatus: "none",
      source: "policy_default",
      explainability: baseExplainability(),
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("verificationStatus:municipality_requires_verified_status"),
        expect.stringContaining("institutionType:municipality_requires_institution_type"),
        expect.stringContaining("publicEntityFlag:municipality_requires_public_entity_flag"),
      ]),
    );
  });

  it("requires reason and audit fields for overrides/specials", () => {
    const parsed = parseAdminPricingControlPolicyContract({
      segment: "team_organization",
      creatorType: "publisher_agency",
      verificationStatus: "verified",
      pricingPlanKind: "professional_team",
      institutionType: "public_institution",
      publicEntityFlag: true,
      feeRuleType: "standard",
      capPolicyType: "custom_capped",
      overrideType: "manual_plan",
      specialOfferStatus: "active",
      pilotStatus: "none",
      source: "policy_default",
      explainability: baseExplainability(),
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("reason:reason_required_for_override_or_special"),
        expect.stringContaining("changedBy:changed_by_required_for_override_or_special"),
        expect.stringContaining("changedAt:changed_at_required_for_override_or_special"),
        expect.stringContaining("source:source_must_reflect_override_or_special"),
      ]),
    );
  });

  it("builds stable audit fields for a valid override contract", () => {
    const parsed = parseAdminPricingControlPolicyContract({
      segment: "team_organization",
      creatorType: "publisher_agency",
      verificationStatus: "verified",
      pricingPlanKind: "professional_team",
      institutionType: "public_institution",
      publicEntityFlag: true,
      feeRuleType: "funding_take_supplement",
      capPolicyType: "custom_capped",
      overrideType: "manual_fee_rule",
      specialOfferStatus: "scheduled",
      pilotStatus: "pilot",
      reason: "Pilotkorridor fuer verifizierte Team-Organisation.",
      changedBy: "admin_user_42",
      changedAt: "2026-03-29T10:00:00.000Z",
      source: "admin_override",
      explainability: baseExplainability(),
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const audit = buildAdminPricingControlAuditFields(parsed.value);
    expect(audit).toMatchObject({
      pricingSegment: "team_organization",
      pricingPolicySource: "admin_override",
      pricingOverrideType: "manual_fee_rule",
      pricingSpecialOfferStatus: "scheduled",
      pricingPilotStatus: "pilot",
      pricingOverrideReason: "Pilotkorridor fuer verifizierte Team-Organisation.",
      pricingChangedBy: "admin_user_42",
    });
  });

  it("treats operator-verified contracts as the v1 production billing truth", () => {
    expect(
      isProductionBillingTruth({
        source: "operator_verified_contract",
        runtimeMarker: "production_runtime",
        auditBacked: true,
      }),
    ).toBe(true);
  });

  it("never treats fixture or pending checkout modes as production billing truth", () => {
    expect(
      isProductionBillingTruth({
        source: "fixture_demo",
        runtimeMarker: "production_runtime",
        auditBacked: true,
      }),
    ).toBe(false);
    expect(
      isProductionBillingTruth({
        source: "operator_verified_contract",
        runtimeMarker: "demo_or_test_runtime",
        auditBacked: true,
      }),
    ).toBe(false);
    expect(
      isProductionBillingTruth({
        source: "external_checkout_pending",
        runtimeMarker: "external_checkout_pending",
        auditBacked: true,
      }),
    ).toBe(false);
  });
});
