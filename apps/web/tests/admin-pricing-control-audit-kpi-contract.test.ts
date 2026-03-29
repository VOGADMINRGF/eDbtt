import { describe, expect, it } from "vitest";
import {
  parseAdminPricingControlAuditEventContract,
  parseAdminPricingControlKpiSnapshotContract,
} from "@/lib/server/pricing/adminPricingControlContract";

function validExplainability() {
  return {
    factors: ["segment", "plan", "funding_fee_rule", "policy_source"],
    summary: "Segment/Plan/Fee folgen der freigegebenen Pricing-Control-Policy.",
  } as const;
}

describe("admin pricing control audit/kpi contract", () => {
  it("accepts a valid override audit event with reason and changed fields", () => {
    const parsed = parseAdminPricingControlAuditEventContract({
      eventType: "override_changed",
      eventAt: "2026-03-29T15:10:00.000Z",
      scope: {
        targetKind: "organization",
        targetId: "org_17",
        segment: "team_organization",
        pricingPlanKind: "professional_team",
      },
      actor: {
        actorId: "admin_user_7",
        actorKind: "admin_user",
      },
      source: "admin_override",
      changedFields: ["pricingPlanKind", "feeRuleType", "capPolicyType"],
      reason: "Sonderkorridor fuer verifiziertes Teamprofil.",
      explainability: validExplainability(),
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.scope.targetKind).toBe("organization");
  });

  it("rejects mutation audit events without reason", () => {
    const parsed = parseAdminPricingControlAuditEventContract({
      eventType: "special_offer_changed",
      eventAt: "2026-03-29T15:11:00.000Z",
      scope: {
        targetKind: "workspace",
        targetId: "ws_9",
        segment: "civic_creator",
        pricingPlanKind: "professional_creator",
      },
      actor: {
        actorId: "service_worker_2",
        actorKind: "service_worker",
      },
      source: "pilot_program",
      changedFields: ["specialOfferStatus"],
      reason: null,
      explainability: validExplainability(),
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([expect.stringContaining("reason:reason_required_for_mutation_event")]),
    );
  });

  it("rejects explainability factors outside the allowlist", () => {
    const parsed = parseAdminPricingControlAuditEventContract({
      eventType: "policy_evaluated",
      eventAt: "2026-03-29T15:12:00.000Z",
      scope: {
        targetKind: "global_policy",
        targetId: null,
        segment: "public_free",
        pricingPlanKind: "public_core",
      },
      actor: {
        actorId: "system_eval",
        actorKind: "system",
      },
      source: "policy_default",
      changedFields: [],
      reason: null,
      explainability: {
        factors: ["truth_score"],
        summary: "Nicht erlaubter Wahrheitsfaktor.",
      },
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.includes("explainability.factors.0"))).toBe(true);
  });

  it("accepts a complete KPI snapshot contract", () => {
    const parsed = parseAdminPricingControlKpiSnapshotContract({
      snapshotAt: "2026-03-29T16:00:00.000Z",
      window: "rolling_30d",
      activeAnlassraeume: 24,
      activeDossiers: 9,
      professionalLayerUsage: 12,
      fundingVolume: 125_000,
      fundingFeeRevenue: 2_400,
      exportUsage: 42,
      embedUsage: 18,
      qrUsage: 11,
      reviewUsage: 53,
      factcheckUsage: 21,
      conversionFreeToCreator: 8,
      conversionCreatorToTeam: 3,
      conversionTeamToOrganization: 1,
      specialsUsage: 4,
      pilotUsage: 2,
      overrideUsage: 5,
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.window).toBe("rolling_30d");
  });

  it("rejects impossible KPI relationships", () => {
    const parsed = parseAdminPricingControlKpiSnapshotContract({
      snapshotAt: "2026-03-29T16:01:00.000Z",
      window: "weekly",
      activeAnlassraeume: 10,
      activeDossiers: 4,
      professionalLayerUsage: 6,
      fundingVolume: 1000,
      fundingFeeRevenue: 1200,
      exportUsage: 10,
      embedUsage: 4,
      qrUsage: 3,
      reviewUsage: 13,
      factcheckUsage: 8,
      conversionFreeToCreator: 2,
      conversionCreatorToTeam: 1,
      conversionTeamToOrganization: 0,
      specialsUsage: 1,
      pilotUsage: 1,
      overrideUsage: 2,
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "fundingFeeRevenue:funding_fee_revenue_cannot_exceed_funding_volume",
        ),
      ]),
    );
  });

  it("rejects unknown KPI dimensions", () => {
    const parsed = parseAdminPricingControlKpiSnapshotContract({
      snapshotAt: "2026-03-29T16:02:00.000Z",
      window: "daily",
      activeAnlassraeume: 5,
      activeDossiers: 2,
      professionalLayerUsage: 3,
      fundingVolume: 1000,
      fundingFeeRevenue: 100,
      exportUsage: 4,
      embedUsage: 2,
      qrUsage: 1,
      reviewUsage: 6,
      factcheckUsage: 2,
      conversionFreeToCreator: 1,
      conversionCreatorToTeam: 0,
      conversionTeamToOrganization: 0,
      specialsUsage: 0,
      pilotUsage: 0,
      overrideUsage: 1,
      truthScoreRevenue: 99,
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.includes("Unrecognized key"))).toBe(true);
  });
});
