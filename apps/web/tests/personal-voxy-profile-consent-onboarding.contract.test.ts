import { describe, expect, it } from "vitest";
import { buildDefaultConsent } from "@/lib/privacy/consent";
import { buildPersonalVoxyProfileConsentOnboardingContract } from "@/features/agenticRuntime/personalVoxyProfileConsentOnboardingContract";

describe("personal voxy profile consent onboarding contract", () => {
  it("blocks profile persistence until privacy notice and explicit consent are present", () => {
    const model = buildPersonalVoxyProfileConsentOnboardingContract({
      requestedMode: "active_companion",
      requestedRelevanceDepth: "full_context",
      requestedNotificationPolicy: "weekly_digest",
      privacyConsent: null,
      explicitPersonalVoxyConsent: false,
    });

    expect(model.profilePersistenceAllowed).toBe(false);
    expect(model.notificationAllowed).toBe(false);
    expect(model.effectiveMode).toBe("passive");
    expect(model.userControlsRelevanceDepth).toBe(true);
    expect(model.onboardingSteps.find((step) => step.id === "confirm_memory")?.status).toBe(
      "requires_consent",
    );
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "personal_voxy",
      status: "review_required",
    });
  });

  it("allows B2C companion memory only after privacy notice and explicit consent", () => {
    const model = buildPersonalVoxyProfileConsentOnboardingContract({
      requestedMode: "topic_watch",
      requestedNotificationPolicy: "important_only",
      privacyConsent: buildDefaultConsent({
        requiredNoticeAcknowledged: true,
        timestamp: "2026-07-14T08:00:00.000Z",
        source: "account",
      }),
      explicitPersonalVoxyConsent: true,
    });

    expect(model.profilePersistenceAllowed).toBe(true);
    expect(model.notificationAllowed).toBe(true);
    expect(model.effectiveMode).toBe("topic_watch");
    expect(model.noHiddenPoliticalProfiling).toBe(true);
    expect(model.noExternalProfileSale).toBe(true);
    expect(model.strongCounterargumentsRemainVisible).toBe(true);
  });

  it("keeps B2B and B2G outside forced personal companion logic", () => {
    const model = buildPersonalVoxyProfileConsentOnboardingContract({
      segment: "b2g",
      requestedMode: "active_companion",
      requestedRelevanceDepth: "headline_only",
      privacyConsent: buildDefaultConsent({
        requiredNoticeAcknowledged: true,
        timestamp: "2026-07-14T08:00:00.000Z",
        source: "account",
      }),
      explicitPersonalVoxyConsent: true,
    });

    expect(model.companionAvailable).toBe(false);
    expect(model.effectiveMode).toBe("passive");
    expect(model.institutionalCompanionForced).toBe(false);
    expect(model.onboardingSteps.every((step) => step.status === "blocked_for_segment")).toBe(
      true,
    );
  });
});
