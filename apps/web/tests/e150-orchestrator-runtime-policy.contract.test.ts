import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  callE150Orchestrator,
  OrchestratorNoProviderError,
} from "@features/ai/orchestratorE150";
import type { E150JourneyProfile } from "@features/ai/e150/journeyProfiles";

const providerMocks = vi.hoisted(() => ({
  logAiUsage: vi.fn(),
  recordAiTelemetry: vi.fn(),
  callOpenAI: vi.fn(),
  callAnthropic: vi.fn(),
  callMistral: vi.fn(),
  callGemini: vi.fn(),
  callAriLLM: vi.fn(),
  anthropicProbe: vi.fn(),
}));

vi.mock("@core/telemetry/aiUsage", () => ({
  logAiUsage: (...args: unknown[]) => providerMocks.logAiUsage(...args),
}));

vi.mock("@features/ai/telemetry", () => ({
  recordAiTelemetry: (...args: unknown[]) => providerMocks.recordAiTelemetry(...args),
}));

vi.mock("@features/ai/providers/openai", () => ({
  callOpenAI: (...args: unknown[]) => providerMocks.callOpenAI(...args),
}));

vi.mock("@features/ai/providers/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => providerMocks.callAnthropic(...args),
  anthropicProbe: (...args: unknown[]) => providerMocks.anthropicProbe(...args),
}));

vi.mock("@features/ai/providers/mistral", () => ({
  callMistral: (...args: unknown[]) => providerMocks.callMistral(...args),
}));

vi.mock("@features/ai/providers/gemini", () => ({
  callGemini: (...args: unknown[]) => providerMocks.callGemini(...args),
}));

vi.mock("@features/ai/providers/ari_llm", () => ({
  callAriLLM: (...args: unknown[]) => providerMocks.callAriLLM(...args),
}));

const VALID_ANALYZE_JSON = JSON.stringify({
  mode: "E150",
  sourceText: null,
  language: "de",
  claims: [],
  findings: [],
  notes: [],
  questions: [],
  missingPerspectives: [],
  knots: [],
  consequences: { consequences: [], responsibilities: [] },
  responsibilityPaths: [],
  eventualities: [],
  decisionTrees: [],
  impactAndResponsibility: { impacts: [], responsibleActors: [] },
  participationCandidates: [],
  report: {
    summary: null,
    keyConflicts: [],
    facts: { local: [], international: [] },
    openQuestions: [],
    takeaways: [],
  },
});

const ANTHROPIC_ONLY_JOURNEY: E150JourneyProfile = {
  journey: "analyze",
  lane: "standard",
  primaryRoles: {
    context_only: ["anthropic"],
  },
  secondaryRoles: {},
  fallbackProviders: ["openai"],
  openAiRoles: ["fallback"],
  verificationDefaults: {
    verificationMode: "none",
    researchUsed: "none",
    sealEligible: false,
    sealGranted: false,
  },
};

describe("e150 orchestrator runtime policy contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }),
    );
    providerMocks.logAiUsage.mockResolvedValue(undefined);
    providerMocks.recordAiTelemetry.mockResolvedValue(undefined);
    providerMocks.anthropicProbe.mockResolvedValue({
      ok: true,
      errorKind: null,
      durationMs: 5,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("applies provider order and maxProviders to the productive orchestrator", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-live-key");
    vi.stubEnv("OPENAI_API_KEY", "openai-live-key");
    vi.stubEnv("AI_PROVIDER_ORDER", "anthropic,openai");
    vi.stubEnv("AI_MAX_PROVIDERS", "1");

    providerMocks.callAnthropic.mockResolvedValue({
      text: VALID_ANALYZE_JSON,
      model: "claude-sonnet-live",
      tokensIn: 12,
      tokensOut: 34,
    });

    const result = await callE150Orchestrator({
      systemPrompt: "system",
      userPrompt: "user",
      journeyProfile: ANTHROPIC_ONLY_JOURNEY,
    });

    expect(result.best.provider).toBe("anthropic");
    expect(providerMocks.callAnthropic).toHaveBeenCalledTimes(1);
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(result.meta.usedProviders).toEqual(["anthropic"]);
    expect(result.meta.skippedProviders).toContainEqual({
      provider: "openai",
      reason: "blocked_by_runtime_policy",
    });
  });

  it("reads runtime policy fresh for each call instead of keeping env snapshots", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-live-key");
    vi.stubEnv("AI_PROVIDER_ORDER", "anthropic");

    providerMocks.callAnthropic.mockResolvedValue({
      text: VALID_ANALYZE_JSON,
      model: "claude-live",
      tokensIn: 8,
      tokensOut: 16,
    });

    vi.stubEnv("ANTHROPIC_MODEL", "claude-sonnet-a");
    await callE150Orchestrator({
      systemPrompt: "system-a",
      userPrompt: "user-a",
      journeyProfile: ANTHROPIC_ONLY_JOURNEY,
    });

    vi.stubEnv("ANTHROPIC_MODEL", "claude-sonnet-b");
    await callE150Orchestrator({
      systemPrompt: "system-b",
      userPrompt: "user-b",
      journeyProfile: ANTHROPIC_ONLY_JOURNEY,
    });

    expect(providerMocks.callAnthropic.mock.calls[0]?.[0]).toMatchObject({
      model: "claude-sonnet-a",
    });
    expect(providerMocks.callAnthropic.mock.calls[1]?.[0]).toMatchObject({
      model: "claude-sonnet-b",
    });
  });

  it("fails closed in preview and production when no runtime provider is configured", async () => {
    for (const env of [
      { NODE_ENV: "production", VERCEL_ENV: "preview" },
      { NODE_ENV: "production", VERCEL_ENV: "production" },
    ]) {
      vi.unstubAllEnvs();
      vi.stubEnv("NODE_ENV", env.NODE_ENV);
      vi.stubEnv("VERCEL_ENV", env.VERCEL_ENV);
      vi.stubEnv("OPENAI_API_KEY", "");
      vi.stubEnv("ANTHROPIC_API_KEY", "");
      vi.stubEnv("MISTRAL_API_KEY", "");
      vi.stubEnv("GEMINI_API_KEY", "");
      vi.stubEnv("GOOGLE_API_KEY", "");
      vi.stubEnv("ARI_API_KEY", "");
      vi.stubEnv("YOUCOM_ARI_API_KEY", "");
      vi.stubEnv("ARI_BASE_URL", "");
      vi.stubEnv("ARI_URL", "");
      vi.stubEnv("ARI_API_URL", "");
      vi.stubEnv("YOUCOM_ARI_API_URL", "");

      await expect(
        callE150Orchestrator({
          systemPrompt: "system",
          userPrompt: "user",
          journeyProfile: ANTHROPIC_ONLY_JOURNEY,
        }),
      ).rejects.toBeInstanceOf(OrchestratorNoProviderError);
    }
  });

  it("keeps provider failures and telemetry logs free of raw upstream text", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-live-key");
    vi.stubEnv("OPENAI_API_KEY", "openai-live-key");
    vi.stubEnv("AI_PROVIDER_ORDER", "anthropic,openai");
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    providerMocks.callAnthropic.mockRejectedValue(
      Object.assign(
        new Error(
          "Alice alice@example.org Prompt: Bitte pruefe das Thema. Response: Volltext Bearer sk-secret",
        ),
        {
          code: "unsafe provider code with spaces",
          status: 500,
        },
      ),
    );
    providerMocks.callOpenAI.mockResolvedValue({
      text: VALID_ANALYZE_JSON,
      model: "gpt-5",
      tokensIn: 9,
      tokensOut: 18,
    });

    const result = await callE150Orchestrator({
      systemPrompt: "system",
      userPrompt: "user",
      journeyProfile: ANTHROPIC_ONLY_JOURNEY,
    });

    expect(result.best.provider).toBe("openai");
    expect(result.meta.failedProviders).toContainEqual(
      expect.objectContaining({
        provider: "anthropic",
        error: "provider_failed",
        providerErrorCode: null,
        errorMessageShort: undefined,
      }),
    );
    expect(result.meta.providerMatrix).toContainEqual(
      expect.objectContaining({
        provider: "anthropic",
        state: "failed",
        reason: "provider_failed",
        errorMessage: null,
        rawExcerpt: null,
        openaiErrorMessage: null,
      }),
    );

    const consoleDump = JSON.stringify(consoleLogSpy.mock.calls);
    expect(consoleDump).not.toContain("alice@example.org");
    expect(consoleDump).not.toContain("Prompt:");
    expect(consoleDump).not.toContain("Response:");
    expect(consoleDump).not.toContain("sk-secret");
  });
});
