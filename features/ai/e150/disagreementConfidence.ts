import type { E150ProviderName } from "./journeyProfiles";

export type E150AgreementLevel = "high" | "mixed" | "low";
export type E150ConfidenceBucket = "high" | "medium" | "low";

export type E150DisagreementMeta = {
  present: boolean;
  insufficientIndependentSuccess: boolean;
  specialistAgreementScore: number;
  specialistAgreement: E150AgreementLevel;
  missingSpecialists: E150ProviderName[];
  successfulProviders: E150ProviderName[];
  failedProviders: E150ProviderName[];
  fallbackReliance: "none" | "full";
  fallbackRelianceScore: number;
  coverage: {
    requiredPrimary: number;
    successfulPrimary: number;
    missingPrimary: number;
  };
};

export type E150ConfidenceMeta = {
  score: number;
  bucket: E150ConfidenceBucket;
  reasons: string[];
};

type ProviderScore = { provider: E150ProviderName; score: number };

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Number(clamp(value).toFixed(3));
}

function uniqueProviders(entries: E150ProviderName[]): E150ProviderName[] {
  const seen = new Set<E150ProviderName>();
  const out: E150ProviderName[] = [];
  entries.forEach((provider) => {
    if (seen.has(provider)) return;
    seen.add(provider);
    out.push(provider);
  });
  return out;
}

function agreementLevel(score: number): E150AgreementLevel {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "mixed";
  return "low";
}

function confidenceBucket(score: number): E150ConfidenceBucket {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

function computeAgreementScore(params: {
  primarySuccessScores: number[];
  coverageRatio: number;
}): number {
  const scores = params.primarySuccessScores;
  if (scores.length === 0) return 0;
  if (scores.length === 1) return round(0.45 * params.coverageRatio + 0.15);

  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = Math.max(0, max - min);
  const spreadFactor = clamp(1 - spread / 1.4);
  const score = spreadFactor * 0.7 + params.coverageRatio * 0.3;
  return round(score);
}

export function computeDisagreementConfidence(params: {
  primaryProviders: readonly E150ProviderName[];
  independentProviderPool?: readonly E150ProviderName[];
  successfulProviders: E150ProviderName[];
  failedProviders: E150ProviderName[];
  candidateScores: ProviderScore[];
  bestProvider: E150ProviderName | null;
  fallbackProviders: readonly E150ProviderName[];
  fallbackUsed: boolean;
}): { disagreement: E150DisagreementMeta; confidence: E150ConfidenceMeta } {
  const primaryProviders = uniqueProviders([...params.primaryProviders]);
  const independentProviderPool = uniqueProviders([
    ...(params.independentProviderPool ?? params.primaryProviders),
  ]);
  const successfulProviders = uniqueProviders([...params.successfulProviders]);
  const failedProviders = uniqueProviders([...params.failedProviders]);
  const successfulSet = new Set(successfulProviders);
  const independentSuccess = independentProviderPool.filter((provider) =>
    successfulSet.has(provider),
  );

  const successfulPrimary = primaryProviders.filter((provider) => successfulSet.has(provider));
  const missingSpecialists = primaryProviders.filter((provider) => !successfulSet.has(provider));
  const coverageRatio =
    primaryProviders.length > 0 ? successfulPrimary.length / primaryProviders.length : 1;
  const primarySuccessScoreList = params.candidateScores
    .filter((entry) => successfulPrimary.includes(entry.provider))
    .map((entry) => entry.score);
  const specialistAgreementScore = computeAgreementScore({
    primarySuccessScores: primarySuccessScoreList,
    coverageRatio,
  });
  const fallbackRelianceScore =
    params.fallbackUsed === true ||
    (params.bestProvider ? params.fallbackProviders.includes(params.bestProvider) : false)
      ? 1
      : 0;
  const attemptedCount = successfulProviders.length + failedProviders.length;
  const failureRatio = attemptedCount > 0 ? failedProviders.length / attemptedCount : 0;
  const insufficientIndependentSuccess = independentSuccess.length < 2;

  const disagreementPresent =
    insufficientIndependentSuccess ||
    missingSpecialists.length > 0 ||
    specialistAgreementScore < 0.55 ||
    fallbackRelianceScore > 0 ||
    failureRatio > 0.34;

  const disagreement: E150DisagreementMeta = {
    present: disagreementPresent,
    insufficientIndependentSuccess,
    specialistAgreementScore,
    specialistAgreement: agreementLevel(specialistAgreementScore),
    missingSpecialists,
    successfulProviders,
    failedProviders,
    fallbackReliance: fallbackRelianceScore > 0 ? "full" : "none",
    fallbackRelianceScore,
    coverage: {
      requiredPrimary: primaryProviders.length,
      successfulPrimary: successfulPrimary.length,
      missingPrimary: missingSpecialists.length,
    },
  };

  let confidenceScore = round(
    0.15 +
      coverageRatio * 0.45 +
      specialistAgreementScore * 0.3 -
      fallbackRelianceScore * 0.2 -
      failureRatio * 0.2,
  );
  const reasons: string[] = [];
  if (insufficientIndependentSuccess) reasons.push("insufficient_independent_success");
  if (missingSpecialists.length > 0) reasons.push(`missing_specialists:${missingSpecialists.length}`);
  if (fallbackRelianceScore > 0) reasons.push("fallback_reliance");
  if (failureRatio > 0.34) reasons.push("provider_failures");
  if (specialistAgreementScore < 0.45) reasons.push("high_disagreement");
  if (reasons.length === 0) reasons.push("strong_specialist_alignment");

  if (insufficientIndependentSuccess) {
    confidenceScore = Math.min(confidenceScore, 0.44);
  } else if (fallbackRelianceScore > 0 || missingSpecialists.length > 0) {
    confidenceScore = Math.min(confidenceScore, 0.74);
  }

  const confidence: E150ConfidenceMeta = {
    score: confidenceScore,
    bucket: confidenceBucket(confidenceScore),
    reasons,
  };

  return { disagreement, confidence };
}
