import { describe, expect, it } from "vitest";

import { computeDisagreementConfidence } from "@features/ai/e150/disagreementConfidence";

describe("e150 disagreement/confidence contract", () => {
  it("reports high specialist agreement without fallback reliance", () => {
    const { disagreement, confidence } = computeDisagreementConfidence({
      primaryProviders: ["mistral", "gemini", "anthropic"],
      successfulProviders: ["mistral", "gemini", "anthropic"],
      failedProviders: [],
      candidateScores: [
        { provider: "mistral", score: 1.1 },
        { provider: "gemini", score: 1.05 },
        { provider: "anthropic", score: 1.08 },
      ],
      bestProvider: "mistral",
      fallbackProviders: ["openai"],
      fallbackUsed: false,
    });

    expect(disagreement.present).toBe(false);
    expect(disagreement.specialistAgreement).toBe("high");
    expect(disagreement.missingSpecialists).toEqual([]);
    expect(disagreement.fallbackReliance).toBe("none");
    expect(confidence.bucket).toBe("high");
    expect(confidence.score).toBeGreaterThanOrEqual(0.75);
  });

  it("reports disagreement for missing specialists and fallback reliance", () => {
    const { disagreement, confidence } = computeDisagreementConfidence({
      primaryProviders: ["mistral", "gemini", "anthropic"],
      successfulProviders: ["openai"],
      failedProviders: ["gemini"],
      candidateScores: [{ provider: "openai", score: 0.7 }],
      bestProvider: "openai",
      fallbackProviders: ["openai"],
      fallbackUsed: true,
    });

    expect(disagreement.present).toBe(true);
    expect(disagreement.missingSpecialists).toEqual(["mistral", "gemini", "anthropic"]);
    expect(disagreement.fallbackReliance).toBe("full");
    expect(disagreement.coverage.successfulPrimary).toBe(0);
    expect(confidence.bucket).toBe("low");
    expect(confidence.reasons).toContain("fallback_reliance");
    expect(confidence.reasons.some((reason) => reason.startsWith("missing_specialists"))).toBe(
      true,
    );
  });
});
