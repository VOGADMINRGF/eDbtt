import { describe, expect, it } from "vitest";
import { buildDefaultConsent } from "@/lib/privacy/consent";
import { buildDailyCivicImpulsesObservationIntakeContract } from "@/features/agenticRuntime/dailyCivicImpulsesObservationIntakeContract";
import { buildPersonalVoxyProfileConsentOnboardingContract } from "@/features/agenticRuntime/personalVoxyProfileConsentOnboardingContract";

describe("daily civic impulses observation intake contract", () => {
  it("keeps impulses optional, capped at three and split observation from fact", () => {
    const consent = buildPersonalVoxyProfileConsentOnboardingContract({
      requestedMode: "active_companion",
      privacyConsent: buildDefaultConsent({
        requiredNoticeAcknowledged: true,
        timestamp: "2026-07-14T08:00:00.000Z",
        source: "account",
      }),
      explicitPersonalVoxyConsent: true,
    });
    const model = buildDailyCivicImpulsesObservationIntakeContract({
      mode: "active_companion",
      consentContract: consent,
    });

    expect(model.optional).toBe(true);
    expect(model.maxPerDay).toBe(3);
    expect(model.prompts).toHaveLength(3);
    expect(model.observationSplit.map((entry) => entry.stage)).toEqual([
      "visible_observation",
      "user_interpretation",
      "possible_hypothesis",
      "source_backed_fact",
    ]);
    expect(model.storageMode).toBe("consented_profile_memory");
    expect(model.noNegativityMachine).toBe(true);
    expect(model.noComplaintVolumeGamification).toBe(true);
  });

  it("keeps profile writes blocked without consent even when impulses are available", () => {
    const consent = buildPersonalVoxyProfileConsentOnboardingContract({
      requestedMode: "relevant_only",
      privacyConsent: null,
      explicitPersonalVoxyConsent: false,
    });
    const model = buildDailyCivicImpulsesObservationIntakeContract({
      mode: "relevant_only",
      consentContract: consent,
    });

    expect(model.storageMode).toBe("review_only_no_profile_write");
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "personal_voxy",
      status: "review_required",
    });
    expect(model.rewardSignals.join(" ")).toContain("Klaerung");
    expect(model.rewardSignals.join(" ")).not.toContain("Beschwerdebonus");
  });
});
