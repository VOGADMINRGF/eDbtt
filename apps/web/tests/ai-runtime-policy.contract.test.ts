import { describe, expect, it } from "vitest";
import {
  AiRuntimePolicyError,
  getAiRuntimePolicyFromEnv,
  resolveAiRuntimeProviderMissingReason,
} from "@/features/ai/aiRuntimePolicy";

describe("ai runtime policy contract", () => {
  it("normalizes the shared runtime policy without exposing secrets", () => {
    const policy = getAiRuntimePolicyFromEnv({
      OPENAI_API_KEY: "test-openai",
      OPENAI_MODEL: "gpt-5",
      OPENAI_PLANNER_MODEL: "gpt-4.1-mini",
      ANTHROPIC_API_KEY: "test-anthropic",
      MISTRAL_API_KEY: "test-mistral",
      GOOGLE_API_KEY: "test-google",
      AI_PROVIDER_ORDER: "openai,anthropic,mistral,gemini",
      AI_MAX_PROVIDERS: "3",
      CREATE_PLANNER_TIMEOUT_MS: "10000",
      OPENAI_SMOKE_TIMEOUT_MS: "30000",
      OPENAI_SMOKE_MAX_OUTPUT_TOKENS: "2200",
      AI_BUDGET_MS_DEFAULT: "35000",
    });

    expect(policy.providerOrder).toEqual(["openai", "anthropic", "mistral"]);
    expect(policy.maxProviders).toBe(3);
    expect(policy.enabledProviders).toEqual(["openai", "anthropic", "mistral"]);
    expect(policy.plannerTimeoutMs).toBe(10_000);
    expect(policy.smokeTimeoutMs).toBe(30_000);
    expect(policy.smokeMaxOutputTokens).toBe(2_200);
    expect(policy.maxOutputTokens).toBe(2_600);
    expect(policy.openai.plannerModelCandidates).toEqual(["gpt-4.1-mini", "gpt-5"]);
    expect(policy.openai.smokeModelCandidates).toEqual(["gpt-5"]);
    expect(policy.social.autoPublishEnabled).toBe(false);
    expect(policy.social.realtimePublishEnabled).toBe(false);
    expect(policy.social.requireReview).toBe(true);
    expect(policy.loggingMode).toBe("metadata_only");
  });

  it("fails closed for negative planner timeouts", () => {
    expect(() =>
      getAiRuntimePolicyFromEnv({
        CREATE_PLANNER_TIMEOUT_MS: "-1",
      }),
    ).toThrowError(AiRuntimePolicyError);
  });

  it("fails closed for excessive smoke output tokens", () => {
    expect(() =>
      getAiRuntimePolicyFromEnv({
        OPENAI_SMOKE_MAX_OUTPUT_TOKENS: "99999",
      }),
    ).toThrowError(AiRuntimePolicyError);
  });

  it("rejects unknown providers instead of silently enabling them", () => {
    expect(() =>
      getAiRuntimePolicyFromEnv({
        AI_PROVIDER_ORDER: "openai,unknown",
      }),
    ).toThrowError(AiRuntimePolicyError);
  });

  it("throws an honest runtime error for an empty provider list", () => {
    expect(() =>
      getAiRuntimePolicyFromEnv({
        AI_PROVIDER_ORDER: " , ",
      }),
    ).toThrowError(AiRuntimePolicyError);
  });

  it("keeps deep research disabled without credit or override", () => {
    const blocked = getAiRuntimePolicyFromEnv({
      OPENAI_API_KEY: "test-openai",
      E150_DEEPSEARCH_ENABLED: "true",
      OPENAI_DEEP_RESEARCH_MODEL: "o4-deep-research-preview",
      DEEP_RESEARCH_CREDIT_AVAILABLE: "0",
      PREMIUM_RESEARCH_OVERRIDE: "0",
    });
    expect(blocked.research.gateEnabled).toBe(true);
    expect(blocked.research.deepResearchEnabled).toBe(false);

    const allowed = getAiRuntimePolicyFromEnv({
      OPENAI_API_KEY: "test-openai",
      E150_DEEPSEARCH_ENABLED: "true",
      OPENAI_DEEP_RESEARCH_MODEL: "o4-deep-research-preview",
      DEEP_RESEARCH_CREDIT_AVAILABLE: "1",
    });
    expect(allowed.research.deepResearchEnabled).toBe(true);
  });

  it("never reports a provider as enabled when its API key is missing", () => {
    const policy = getAiRuntimePolicyFromEnv({
      AI_PROVIDER_ORDER: "openai,anthropic,mistral,gemini",
      GOOGLE_API_KEY: "test-google",
    });

    expect(policy.enabledProviders).toEqual(["gemini"]);
    expect(resolveAiRuntimeProviderMissingReason("openai", policy)).toBe("missing OPENAI_API_KEY");
  });

  it("forces review-first social guardrails even when env flags request publish", () => {
    const policy = getAiRuntimePolicyFromEnv({
      SOCIAL_DISTRIBUTION_ENABLED: "1",
      SOCIAL_AUTO_PUBLISH_ENABLED: "1",
      SOCIAL_REALTIME_PUBLISH_ENABLED: "1",
      SOCIAL_REQUIRE_REVIEW: "0",
    });

    expect(policy.social.distributionEnabled).toBe(true);
    expect(policy.social.autoPublishEnabled).toBe(false);
    expect(policy.social.realtimePublishEnabled).toBe(false);
    expect(policy.social.requireReview).toBe(true);
  });
});
