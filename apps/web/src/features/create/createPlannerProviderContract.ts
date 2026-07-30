export type CreatePlannerValidatedProviderSource =
  | "openai"
  | "anthropic"
  | "mistral";

export type CreatePlannerProviderAttemptStatus =
  | "succeeded"
  | "failed"
  | "quality_failed";

export type CreatePlannerProviderAttemptIdentity = {
  attempt: number;
  provider: CreatePlannerValidatedProviderSource;
  model: string;
  status: CreatePlannerProviderAttemptStatus;
  resultCode: string;
  responseLength: number | null;
  responseHash: string | null;
};

export function isCreatePlannerProviderSource(
  source: string | null | undefined,
): source is CreatePlannerValidatedProviderSource {
  return source === "openai" || source === "anthropic" || source === "mistral";
}

export function hasValidatedCreatePlannerProviderIdentity(input: {
  source: string | null | undefined;
  plannerSource: string | null | undefined;
  plannerProvider: string | null | undefined;
  providerPlan?: {
    plannerProvider?: string | null;
  } | null;
  providerAttemptCount?: number | null;
  providerAttempts?: CreatePlannerProviderAttemptIdentity[] | null;
  plannerDebug?: {
    attemptedProvider?: string | null;
    usedProvider?: string | null;
    attemptedModel?: string | null;
    usedModel?: string | null;
    attemptNumber?: number | null;
  } | null;
}): input is {
  source: CreatePlannerValidatedProviderSource;
  plannerSource: CreatePlannerValidatedProviderSource;
  plannerProvider: CreatePlannerValidatedProviderSource;
  providerPlan: {
    plannerProvider: CreatePlannerValidatedProviderSource;
  };
  providerAttemptCount: number;
  providerAttempts: CreatePlannerProviderAttemptIdentity[];
  plannerDebug: {
    attemptedProvider: CreatePlannerValidatedProviderSource;
    usedProvider: CreatePlannerValidatedProviderSource;
    attemptedModel: string;
    usedModel: string;
    attemptNumber: number;
  };
} {
  const provider = input.source;
  const attemptCount = input.providerAttemptCount;
  const attempts = input.providerAttempts;
  const debug = input.plannerDebug;
  if (
    !isCreatePlannerProviderSource(provider) ||
    !isCreatePlannerProviderSource(input.plannerSource) ||
    !isCreatePlannerProviderSource(input.plannerProvider) ||
    !isCreatePlannerProviderSource(input.providerPlan?.plannerProvider) ||
    !isCreatePlannerProviderSource(debug?.attemptedProvider) ||
    !isCreatePlannerProviderSource(debug?.usedProvider) ||
    !Number.isInteger(attemptCount) ||
    (attemptCount ?? 0) < 1 ||
    (attemptCount ?? 0) > 2 ||
    !Array.isArray(attempts) ||
    attempts.length !== attemptCount ||
    typeof debug?.attemptedModel !== "string" ||
    !debug.attemptedModel.trim() ||
    typeof debug?.usedModel !== "string" ||
    !debug.usedModel.trim() ||
    debug.attemptedModel !== debug.usedModel ||
    debug.attemptNumber !== attemptCount
  ) {
    return false;
  }

  const attemptsAreConsistent = attempts.every((attempt, index) => {
    const expectedAttempt = index + 1;
    return (
      attempt.attempt === expectedAttempt &&
      isCreatePlannerProviderSource(attempt.provider) &&
      typeof attempt.model === "string" &&
      attempt.model.trim().length > 0 &&
      (attempt.status === "succeeded" ||
        attempt.status === "failed" ||
        attempt.status === "quality_failed") &&
      typeof attempt.resultCode === "string" &&
      attempt.resultCode.trim().length > 0 &&
      (attempt.responseLength === null ||
        (Number.isInteger(attempt.responseLength) && attempt.responseLength >= 0)) &&
      (attempt.responseHash === null ||
        (typeof attempt.responseHash === "string" &&
          /^[a-f0-9]{64}$/i.test(attempt.responseHash)))
    );
  });
  const finalAttempt = attempts[attempts.length - 1];

  return (
    attemptsAreConsistent &&
    Boolean(finalAttempt) &&
    finalAttempt.status === "succeeded" &&
    provider === input.plannerSource &&
    provider === input.plannerProvider &&
    provider === input.providerPlan.plannerProvider &&
    provider === debug.attemptedProvider &&
    provider === debug.usedProvider &&
    finalAttempt.provider === provider &&
    finalAttempt.model === debug.attemptedModel &&
    finalAttempt.model === debug.usedModel
  );
}
