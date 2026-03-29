import { describe, expect, it } from "vitest";
import {
  buildFundingImpactLifecycleBaseline,
  buildFundingImpactLifecycleDisclosure,
  parseFundingImpactLifecycleContract,
} from "@/lib/server/funding/fundingImpactLifecycleContract";

describe("funding impact lifecycle contract", () => {
  it("builds anlassraum-first baseline for governance-safe tracking", () => {
    const baseline = buildFundingImpactLifecycleBaseline({
      supportScope: "anlassraum",
      matchingFrame: "none",
      anlassraumId: "anlass_301",
      dossierId: null,
    });

    expect(baseline.supportScope).toBe("anlassraum");
    expect(baseline.impactStatus).toBe("not_started");
    expect(baseline.followUpStatus).toBe("open");
    expect(baseline.refundingStatus).toBe("none");
    expect(baseline.guardrails.forbidsPersonalRewardLogic).toBe(true);
    expect(buildFundingImpactLifecycleDisclosure(baseline)).toMatchObject({
      anlassraumId: "anlass_301",
      impactStatus: "not_started",
      refundingStatus: "none",
    });
  });

  it("requires reasons for refunding/reallocation flows", () => {
    const parsed = parseFundingImpactLifecycleContract({
      supportScope: "anlassraum",
      matchingFrame: "enabling_fund",
      anlassraumId: "anlass_302",
      dossierId: null,
      impactStatus: "in_progress",
      impactReason: null,
      followUpStatus: "in_review",
      refundingStatus: "review_required",
      refundingReasonType: null,
      refundingReason: null,
      transparency: {
        impactVisible: true,
        followUpVisible: true,
        refundingVisible: true,
        reasonVisible: true,
      },
      explainability: {
        reasonRequired: true,
        auditFieldsRequired: [
          "impactStatus",
          "followUpStatus",
          "refundingStatus",
          "reason",
          "changedBy",
          "changedAt",
        ],
      },
      guardrails: {
        keepsAnlassraumFirst: true,
        keepsProjectBasedMatching: true,
        separatesFromSignal: true,
        separatesFromLegitimation: true,
        separatesFromTruthAndFactStatus: true,
        forbidsPersonalRewardLogic: true,
        forbidsCaptureOverride: true,
      },
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("refundingReasonType:refunding_reason_type_required"),
        expect.stringContaining("refundingReason:refunding_reason_required"),
      ]),
    );
  });

  it("rejects reward-like drift fields by strict contract parsing", () => {
    const parsed = parseFundingImpactLifecycleContract({
      supportScope: "dossier_adjacent",
      matchingFrame: "community_contributions",
      anlassraumId: null,
      dossierId: "dossier_44",
      impactStatus: "not_realized",
      impactReason: "Mandat wurde im Pruefpfad gestoppt.",
      followUpStatus: "action_required",
      refundingStatus: "pending",
      refundingReasonType: "governance_veto",
      refundingReason: "Umwidmungsentscheidung in Vorbereitung.",
      transparency: {
        impactVisible: true,
        followUpVisible: true,
        refundingVisible: true,
        reasonVisible: true,
      },
      explainability: {
        reasonRequired: true,
        auditFieldsRequired: [
          "impactStatus",
          "followUpStatus",
          "refundingStatus",
          "reason",
          "changedBy",
          "changedAt",
        ],
      },
      guardrails: {
        keepsAnlassraumFirst: true,
        keepsProjectBasedMatching: true,
        separatesFromSignal: true,
        separatesFromLegitimation: true,
        separatesFromTruthAndFactStatus: true,
        forbidsPersonalRewardLogic: true,
        forbidsCaptureOverride: true,
      },
      rewardPoints: 22,
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.includes("Unrecognized key"))).toBe(true);
  });

  it("keeps matching frame project-bound to anlassraum scope", () => {
    const parsed = parseFundingImpactLifecycleContract({
      supportScope: "dossier_adjacent",
      matchingFrame: "community_contributions",
      anlassraumId: null,
      dossierId: "dossier_45",
      impactStatus: "not_realized",
      impactReason: "Mandat wurde gestoppt.",
      followUpStatus: "action_required",
      refundingStatus: "pending",
      refundingReasonType: "governance_veto",
      refundingReason: "Umwidmungsentscheidung in Vorbereitung.",
      transparency: {
        impactVisible: true,
        followUpVisible: true,
        refundingVisible: true,
        reasonVisible: true,
      },
      explainability: {
        reasonRequired: true,
        auditFieldsRequired: [
          "impactStatus",
          "followUpStatus",
          "refundingStatus",
          "reason",
          "changedBy",
          "changedAt",
        ],
      },
      guardrails: {
        keepsAnlassraumFirst: true,
        keepsProjectBasedMatching: true,
        separatesFromSignal: true,
        separatesFromLegitimation: true,
        separatesFromTruthAndFactStatus: true,
        forbidsPersonalRewardLogic: true,
        forbidsCaptureOverride: true,
      },
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("matchingFrame:matching_frame_requires_anlassraum_scope"),
      ]),
    );
  });
});
