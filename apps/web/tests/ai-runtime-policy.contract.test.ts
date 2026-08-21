import { describe, expect, it } from "vitest";
import {
  AiRuntimePolicyError,
  getAiRuntimePolicyFromEnv,
  resolveAiRuntimeProviderMissingReason,
  resolveAiRuntimeModeFromEnv,
} from "@features/ai/aiRuntimePolicy";

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
    expect(policy.openai.plannerModelCandidates).toEqual(["gpt-4.1-mini", "gpt-4o-mini", "gpt-5"]);
    expect(policy.openai.smokeModelCandidates).toEqual(["gpt-5"]);
    expect(policy.social.autoPublishEnabled).toBe(false);
    expect(policy.social.realtimePublishEnabled).toBe(false);
    expect(policy.social.requireReview).toBe(true);
    expect(policy.loggingMode).toBe("metadata_only");
  });

  it("routes planner work through the fast model before the full model when no planner model is configured", () => {
    const policy = getAiRuntimePolicyFromEnv({
      OPENAI_API_KEY: "test-openai",
      OPENAI_MODEL: "gpt-5",
    });

    expect(policy.openai.fastModel).toBe("gpt-4o-mini");
    expect(policy.openai.plannerModelCandidates).toEqual(["gpt-4o-mini", "gpt-5"]);
  });

  it("honors an explicit fast model between an explicit planner model and the full model", () => {
    const policy = getAiRuntimePolicyFromEnv({
      OPENAI_API_KEY: "test-openai",
      OPENAI_MODEL: "gpt-5",
      OPENAI_PLANNER_MODEL: "planner-special",
      OPENAI_FAST_MODEL: "fast-special",
    });

    expect(policy.openai.fastModel).toBe("fast-special");
    expect(policy.openai.plannerModelCandidates).toEqual([
      "planner-special",
      "fast-special",
      "gpt-5",
    ]);
  });

  it("keeps productive E150 timing separate from smoke diagnostics", () => {
    const policy = getAiRuntimePolicyFromEnv({});

    expect(policy.smokeTimeoutMs).toBe(30_000);
    expect(policy.profiles.fullContract.timeoutMs).toBe(45_000);
    expect(policy.orchestratorBudgetMs).toBe(50_000);
    expect(policy.profiles.fullContract.maxOutputTokens).toBe(2_600);
  });

  it("fails closed when E150 budget cannot contain the full-contract timeout", () => {
    expect(() =>
      getAiRuntimePolicyFromEnv({
        E150_FULL_CONTRACT_TIMEOUT_MS: "45000",
        E150_ANALYZE_BUDGET_MS: "35000",
      }),
    ).toThrowError(AiRuntimePolicyError);
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

  it("fails closed for invalid boolean env values", () => {
    try {
      getAiRuntimePolicyFromEnv({
        GEMINI_DISABLED: "sometimes",
      });
      throw new Error("expected AiRuntimePolicyError");
    } catch (error) {
      expect(error).toBeInstanceOf(AiRuntimePolicyError);
      expect((error as AiRuntimePolicyError).code).toBe("INVALID_BOOLEAN");
      expect((error as AiRuntimePolicyError).envVar).toBe("GEMINI_DISABLED");
    }
  });

  it("treats placeholder credentials as missing across providers", () => {
    const policy = getAiRuntimePolicyFromEnv({
      AI_PROVIDER_ORDER: "openai,anthropic,gemini",
      OPENAI_API_KEY: "__set_in_secret_manager__",
      ANTHROPIC_API_KEY: "replace_me",
      GOOGLE_API_KEY: "changeme",
    });

    expect(policy.enabledProviders).toEqual([]);
    expect(resolveAiRuntimeProviderMissingReason("openai", policy)).toBe("missing OPENAI_API_KEY");
    expect(resolveAiRuntimeProviderMissingReason("anthropic", policy)).toBe("missing ANTHROPIC_API_KEY");
    expect(resolveAiRuntimeProviderMissingReason("gemini", policy)).toBe(
      "missing GEMINI_API_KEY / GOOGLE_API_KEY",
    );
  });

  it("resolves runtime modes honestly for development, preview and production", () => {
    expect(resolveAiRuntimeModeFromEnv({})).toBe("development");
    expect(resolveAiRuntimeModeFromEnv({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe("preview");
    expect(resolveAiRuntimeModeFromEnv({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(
      "production",
    );
  });
});
