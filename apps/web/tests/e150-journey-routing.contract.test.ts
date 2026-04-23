import { describe, expect, it } from "vitest";

import {
  flattenRoleProviders,
  getJourneyProfile,
  type E150JourneyKey,
} from "@features/ai/e150/journeyProfiles";
import { resolveJourneyKey } from "@features/ai/e150/roleRouting";
import {
  applyPresentationPassStub,
  canUsePresentationPass,
} from "@features/ai/e150/presentationPass";

describe("GOV-AI-ORCH-05 journey defaults", () => {
  const standardJourneys: E150JourneyKey[] = ["analyze", "media", "guided"];

  it("keeps OpenAI out of primary providers in standard lanes", () => {
    standardJourneys.forEach((journey) => {
      const profile = getJourneyProfile(journey);
      const primaryProviders = flattenRoleProviders(profile.primaryRoles);
      expect(profile.lane).toBe("standard");
      expect(primaryProviders).not.toContain("openai");
      expect(profile.fallbackProviders).toEqual(["openai"]);
      expect(profile.openAiRoles).toEqual(["fallback", "presentation_pass"]);
      expect(profile.verificationDefaults.researchUsed).toBe("none");
      expect(profile.verificationDefaults.sealEligible).toBe(false);
      expect(profile.verificationDefaults.sealGranted).toBe(false);
    });
  });

  it("maps factcheck contexts to the sealed_factcheck journey", () => {
    expect(resolveJourneyKey({ pipeline: "factcheck" })).toBe("sealed_factcheck");
    expect(resolveJourneyKey({ routePath: "/api/factcheck/enqueue" })).toBe("sealed_factcheck");
    expect(resolveJourneyKey({ sealedFactcheck: true })).toBe("sealed_factcheck");
  });

  it("keeps sealed_factcheck as the only sealed lane with research", () => {
    const profile = getJourneyProfile("sealed_factcheck");
    expect(profile.lane).toBe("sealed_factcheck");
    expect(profile.verificationDefaults.verificationMode).toBe("sealed");
    expect(profile.verificationDefaults.researchUsed).toBe("search");
    expect(profile.verificationDefaults.sealEligible).toBe(true);
    expect(profile.verificationDefaults.sealGranted).toBe(false);
    expect(flattenRoleProviders(profile.primaryRoles)).toContain("ari");
    expect(profile.fallbackProviders).toEqual(["openai"]);
  });

  it("allows presentation pass only for OpenAI and keeps stub non-mutative", () => {
    expect(canUsePresentationPass("openai")).toBe(true);
    expect(canUsePresentationPass("anthropic")).toBe(false);

    const sample = "Original text";
    const applied = applyPresentationPassStub({
      provider: "openai",
      text: sample,
      enabled: true,
    });

    expect(applied.applied).toBe(false);
    expect(applied.text).toBe(sample);
    expect(applied.policy?.nonMutative).toBe(true);
  });
});
