import type { ResearchUsed, VerificationMode } from "./verificationContract";

export type E150ProviderName = "openai" | "anthropic" | "mistral" | "gemini" | "ari";
export type E150Lane = "standard" | "sealed_factcheck" | "material_grounding";
export type E150JourneyKey = "analyze" | "media" | "guided" | "sealed_factcheck" | "material_grounding";

export type E150RoleProviders = Record<string, readonly E150ProviderName[]>;

export type E150JourneyVerificationDefaults = {
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
};

export type E150JourneyProfile = {
  journey: E150JourneyKey;
  lane: E150Lane;
  primaryRoles: E150RoleProviders;
  secondaryRoles: E150RoleProviders;
  fallbackProviders: readonly E150ProviderName[];
  openAiRoles: readonly ("fallback" | "presentation_pass")[];
  verificationDefaults: E150JourneyVerificationDefaults;
};

export const E150_JOURNEY_PROFILES: Record<E150JourneyKey, E150JourneyProfile> = {
  analyze: {
    journey: "analyze",
    lane: "standard",
    primaryRoles: {
      structure: ["mistral"],
      questions_challenge: ["gemini"],
      context_cross_check: ["anthropic"],
    },
    secondaryRoles: {
      disagreement_cross_check: ["anthropic", "gemini"],
    },
    fallbackProviders: ["openai"],
    openAiRoles: ["fallback", "presentation_pass"],
    verificationDefaults: {
      verificationMode: "none",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
    },
  },
  media: {
    journey: "media",
    lane: "standard",
    primaryRoles: {
      context_report_depth: ["anthropic"],
      structure: ["mistral"],
      challenge_questions: ["gemini"],
    },
    secondaryRoles: {
      disagreement_cross_check: ["gemini", "anthropic"],
    },
    fallbackProviders: ["openai"],
    openAiRoles: ["fallback", "presentation_pass"],
    verificationDefaults: {
      verificationMode: "precheck",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
    },
  },
  guided: {
    journey: "guided",
    lane: "standard",
    primaryRoles: {
      responsibility_structure: ["mistral"],
      formal_context_reasoning: ["anthropic"],
      risks_questions: ["gemini"],
    },
    secondaryRoles: {
      disagreement_cross_check: ["anthropic", "gemini"],
    },
    fallbackProviders: ["openai"],
    openAiRoles: ["fallback", "presentation_pass"],
    verificationDefaults: {
      verificationMode: "precheck",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
    },
  },
  material_grounding: {
    journey: "material_grounding",
    lane: "material_grounding",
    primaryRoles: {
      material_research: ["gemini"],
      structure: ["mistral"],
      readable_summary: ["anthropic"],
    },
    secondaryRoles: {
      disagreement_cross_check: ["anthropic", "gemini"],
    },
    fallbackProviders: ["openai"],
    openAiRoles: ["fallback", "presentation_pass"],
    verificationDefaults: {
      verificationMode: "precheck",
      researchUsed: "gemini",
      sealEligible: false,
      sealGranted: false,
    },
  },
  sealed_factcheck: {
    journey: "sealed_factcheck",
    lane: "sealed_factcheck",
    primaryRoles: {
      retrieval_search: ["ari"],
      reasoning_context: ["anthropic"],
      counter_challenge: ["gemini"],
      claim_atomization: ["mistral"],
    },
    secondaryRoles: {
      disagreement_cross_check: ["anthropic", "gemini"],
    },
    fallbackProviders: ["openai"],
    openAiRoles: ["fallback", "presentation_pass"],
    verificationDefaults: {
      verificationMode: "sealed",
      researchUsed: "search",
      sealEligible: true,
      sealGranted: false,
    },
  },
};

export function getJourneyProfile(journey: E150JourneyKey): E150JourneyProfile {
  return E150_JOURNEY_PROFILES[journey];
}

export function flattenRoleProviders(roleMap: E150RoleProviders): E150ProviderName[] {
  const seen = new Set<E150ProviderName>();
  const providers: E150ProviderName[] = [];
  Object.values(roleMap).forEach((entries) => {
    entries.forEach((provider) => {
      if (seen.has(provider)) return;
      seen.add(provider);
      providers.push(provider);
    });
  });
  return providers;
}
