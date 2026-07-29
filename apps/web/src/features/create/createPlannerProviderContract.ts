export type CreatePlannerValidatedProviderSource =
  | "openai"
  | "anthropic"
  | "mistral";

export function isCreatePlannerProviderSource(
  source: string | null | undefined,
): source is CreatePlannerValidatedProviderSource {
  return source === "openai" || source === "anthropic" || source === "mistral";
}
