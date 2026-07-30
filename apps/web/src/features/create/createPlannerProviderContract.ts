export type CreatePlannerValidatedProviderSource =
  | "openai"
  | "anthropic"
  | "mistral";

export function isCreatePlannerProviderSource(
  source: string | null | undefined,
): source is CreatePlannerValidatedProviderSource {
  return source === "openai" || source === "anthropic" || source === "mistral";
}

export function hasValidatedCreatePlannerProviderIdentity(input: {
  source: string | null | undefined;
  plannerSource: string | null | undefined;
  plannerProvider: string | null | undefined;
}): input is {
  source: CreatePlannerValidatedProviderSource;
  plannerSource: CreatePlannerValidatedProviderSource;
  plannerProvider: CreatePlannerValidatedProviderSource;
} {
  return (
    isCreatePlannerProviderSource(input.source) &&
    isCreatePlannerProviderSource(input.plannerSource) &&
    isCreatePlannerProviderSource(input.plannerProvider) &&
    input.source === input.plannerSource &&
    input.source === input.plannerProvider
  );
}
