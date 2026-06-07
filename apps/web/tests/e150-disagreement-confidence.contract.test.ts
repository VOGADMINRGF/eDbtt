import { describe, expect, it } from "vitest";

import { computeDisagreementConfidence } from "@features/ai/e150/disagreementConfidence";

describe("e150 disagreement confidence guard", () => {
  it("treats specialist plus fallback as insufficient independent success", () => {
    const result = computeDisagreementConfidence({
      primaryProviders: ["mistral", "anthropic"],
      independentProviderPool: ["mistral", "anthropic", "gemini"],
      successfulProviders: ["mistral", "openai"],
      failedProviders: ["anthropic"],
      candidateScores: [
        { provider: "mistral", score: 0.92 },
        { provider: "openai", score: 0.99 },
      ],
      bestProvider: "openai",
      fallbackProviders: ["openai"],
      fallbackUsed: true,
    });

    expect(result.disagreement.present).toBe(true);
    expect(result.disagreement.insufficientIndependentSuccess).toBe(true);
    expect(result.confidence.bucket).toBe("low");
    expect(result.confidence.reasons).toContain("insufficient_independent_success");
    expect(result.confidence.reasons).toContain("fallback_reliance");
  });

  it("accepts two successful non-fallback specialists as independent success", () => {
    const result = computeDisagreementConfidence({
      primaryProviders: ["mistral", "anthropic"],
      independentProviderPool: ["mistral", "anthropic", "gemini"],
      successfulProviders: ["mistral", "gemini"],
      failedProviders: ["anthropic"],
      candidateScores: [
        { provider: "mistral", score: 0.79 },
        { provider: "gemini", score: 0.76 },
      ],
      bestProvider: "mistral",
      fallbackProviders: ["openai"],
      fallbackUsed: false,
    });

    expect(result.disagreement.insufficientIndependentSuccess).toBe(false);
    expect(result.confidence.reasons).not.toContain("insufficient_independent_success");
  });

  it("keeps only fallback success at low confidence", () => {
    const result = computeDisagreementConfidence({
      primaryProviders: ["mistral", "anthropic"],
      independentProviderPool: ["mistral", "anthropic", "gemini"],
      successfulProviders: ["openai"],
      failedProviders: ["mistral", "anthropic"],
      candidateScores: [{ provider: "openai", score: 0.98 }],
      bestProvider: "openai",
      fallbackProviders: ["openai"],
      fallbackUsed: true,
    });

    expect(result.disagreement.insufficientIndependentSuccess).toBe(true);
    expect(result.confidence.bucket).toBe("low");
    expect(result.confidence.reasons).toEqual(
      expect.arrayContaining(["fallback_reliance", "insufficient_independent_success"]),
    );
  });

  it("keeps missing specialists visible even with two independent successes", () => {
    const result = computeDisagreementConfidence({
      primaryProviders: ["mistral", "anthropic", "gemini"],
      independentProviderPool: ["mistral", "anthropic", "gemini"],
      successfulProviders: ["anthropic", "gemini"],
      failedProviders: ["mistral"],
      candidateScores: [
        { provider: "anthropic", score: 0.73 },
        { provider: "gemini", score: 0.68 },
      ],
      bestProvider: "anthropic",
      fallbackProviders: ["openai"],
      fallbackUsed: false,
    });

    expect(result.disagreement.insufficientIndependentSuccess).toBe(false);
    expect(result.disagreement.missingSpecialists).toContain("mistral");
    expect(result.confidence.reasons).toContain("missing_specialists:1");
  });
});
