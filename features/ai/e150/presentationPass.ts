import type { E150ProviderName } from "./journeyProfiles";

export type PresentationPassProvider = "openai";

export type PresentationPassPolicy = {
  provider: PresentationPassProvider;
  role: "presentation_pass";
  nonMutative: true;
  rules: readonly string[];
};

export const OPENAI_PRESENTATION_PASS_POLICY: PresentationPassPolicy = {
  provider: "openai",
  role: "presentation_pass",
  nonMutative: true,
  rules: [
    "no_claim_mutation",
    "no_evidence_mutation",
    "no_verdict_mutation",
    "no_trust_or_decision_mutation",
    "style_readability_tone_only",
  ],
};

export function canUsePresentationPass(provider: E150ProviderName): boolean {
  return provider === "openai";
}

export function applyPresentationPassStub(params: {
  provider: E150ProviderName;
  text: string;
  enabled?: boolean;
}): { applied: boolean; text: string; policy: PresentationPassPolicy | null } {
  if (!params.enabled) return { applied: false, text: params.text, policy: null };
  if (!canUsePresentationPass(params.provider)) {
    return { applied: false, text: params.text, policy: null };
  }
  return {
    applied: false,
    text: params.text,
    policy: OPENAI_PRESENTATION_PASS_POLICY,
  };
}
