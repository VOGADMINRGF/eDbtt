export const CREATE_MUTATION_CSRF_HEADER = "x-edebatte-create-csrf";
export const CREATE_MUTATION_CSRF_VALUE = "create-mutation-v1";
export const CREATE_MAX_TEXT_LENGTH = 10_000;
export const CREATE_MAX_CONTEXT_LENGTH = 2_000;
export const CREATE_MAX_URL_LENGTH = 2_048;

export function createMutationRequestHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    [CREATE_MUTATION_CSRF_HEADER]: CREATE_MUTATION_CSRF_VALUE,
  };
}
