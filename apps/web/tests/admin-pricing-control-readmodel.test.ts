import { describe, expect, it } from "vitest";
import { buildAdminPricingControlReadModel } from "@/lib/server/pricing/adminPricingControlReadModel";

function basePolicy() {
  return {
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
    reason: "Verifizierter Teamkorridor.",
    changedBy: "admin_1",
    changedAt: "2026-03-29T17:00:00.000Z",
    source: "admin_override",
    explainability: {
      segment: {
        factors: ["segment", "verification_status"],
        note: "Segment folgt Verifizierungs- und Rollenstatus.",
      },
      plan: {
        factors: ["plan", "creator_type"],
        note: "Plan folgt Segment und Creator-Typ.",
      },
      fee: {
        factors: ["funding_fee_rule", "cap_policy"],
        note: "Fee/Caps folgen der Policy.",
      },
      specialStatus: {
        factors: ["special_offer_status", "pilot_status", "policy_source"],
        note: "Sonderstatus transparent und auditierbar.",
      },
    },
  } as const;
}

describe("admin pricing control readmodel", () => {
  it("builds a readmodel from valid policy + audit + KPI contracts", () => {
    const readModel = buildAdminPricingControlReadModel({
      policy: basePolicy(),
      latestAuditEvent: {
        eventType: "override_changed",
        eventAt: "2026-03-29T17:01:00.000Z",
        scope: {
          targetKind: "organization",
          targetId: "org_77",
          segment: "team_organization",
          pricingPlanKind: "professional_team",
        },
        actor: {
          actorId: "admin_1",
          actorKind: "admin_user",
        },
        source: "admin_override",
        changedFields: ["feeRuleType", "capPolicyType"],
        reason: "Temporärer Teamkorridor",
        explainability: {
          factors: ["funding_fee_rule", "cap_policy", "policy_source"],
          summary: "Fee/Cap folgen dokumentierter Sonderregel.",
        },
      },
      kpiSnapshot: {
        snapshotAt: "2026-03-29T17:02:00.000Z",
        window: "rolling_30d",
        activeAnlassraeume: 12,
        activeDossiers: 5,
        professionalLayerUsage: 9,
        fundingVolume: 200000,
        fundingFeeRevenue: 4000,
        exportUsage: 30,
        embedUsage: 12,
        qrUsage: 7,
        reviewUsage: 21,
        factcheckUsage: 11,
        conversionFreeToCreator: 3,
        conversionCreatorToTeam: 1,
        conversionTeamToOrganization: 1,
        specialsUsage: 2,
        pilotUsage: 1,
        overrideUsage: 3,
      },
      sourceOfTruthHints: ["users.membership.edebatte.planKey"],
    });

    expect(readModel.ok).toBe(true);
    if (!readModel.ok) return;
    expect(readModel.value.currentSegment).toBe("team_organization");
    expect(readModel.value.activeOverrides.hasActiveOverride).toBe(true);
    expect(readModel.value.auditState.status).toBe("present");
    expect(readModel.value.kpiSummary.status).toBe("present");
    expect(readModel.value.guardrails.forbiddenPricingAxes).toContain("truth_status");
  });

  it("fails on invalid policy contract", () => {
    const readModel = buildAdminPricingControlReadModel({
      policy: {
        ...basePolicy(),
        segment: "municipality_public",
        verificationStatus: "pending",
      },
    });

    expect(readModel.ok).toBe(false);
    if (readModel.ok) return;
    expect(readModel.error).toBe("invalid_pricing_control_readmodel_policy");
  });

  it("keeps readmodel available if audit snapshot is invalid", () => {
    const readModel = buildAdminPricingControlReadModel({
      policy: basePolicy(),
      latestAuditEvent: {
        eventType: "override_changed",
        eventAt: "2026-03-29T17:01:00.000Z",
        scope: {
          targetKind: "organization",
          targetId: "org_77",
          segment: "team_organization",
          pricingPlanKind: "professional_team",
        },
        actor: {
          actorId: "admin_1",
          actorKind: "admin_user",
        },
        source: "policy_default",
        changedFields: ["feeRuleType"],
        reason: null,
        explainability: {
          factors: ["funding_fee_rule", "policy_source"],
          summary: "Ungültiger Auditfall",
        },
      },
    });

    expect(readModel.ok).toBe(true);
    if (!readModel.ok) return;
    expect(readModel.value.auditState.status).toBe("invalid");
    expect(readModel.value.auditState.issues.length).toBeGreaterThan(0);
  });
});
