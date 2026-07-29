import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callOpenAIJson: vi.fn(),
  callAnthropic: vi.fn(),
  callMistral: vi.fn(),
  logAiUsage: vi.fn(),
}));

vi.mock("@features/ai", () => ({
  callOpenAIJson: (...args: unknown[]) => mocks.callOpenAIJson(...args),
}));
vi.mock("@features/ai/providers/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => mocks.callAnthropic(...args),
}));
vi.mock("@features/ai/providers/mistral", () => ({
  callMistral: (...args: unknown[]) => mocks.callMistral(...args),
}));
vi.mock("@core/telemetry/aiUsage", () => ({
  logAiUsage: (...args: unknown[]) => mocks.logAiUsage(...args),
}));

import { buildCreatePlanner } from "@/features/create/createPlanner";

const ENV_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_PLANNER_MODEL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_DISABLED",
  "MISTRAL_API_KEY",
  "AI_PROVIDER_ORDER",
] as const;

describe("create planner cross-provider fallback contract", () => {
  const originalEnv = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]]),
  );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "openai-test-key";
    process.env.OPENAI_MODEL = "gpt-5";
    process.env.OPENAI_PLANNER_MODEL = "gpt-4.1-mini";
    process.env.ANTHROPIC_API_KEY = "anthropic-test-key";
    process.env.ANTHROPIC_DISABLED = "0";
    delete process.env.MISTRAL_API_KEY;
    process.env.AI_PROVIDER_ORDER = "openai,anthropic,mistral";
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("uses exactly one alternative provider after a transient primary failure", async () => {
    mocks.callOpenAIJson.mockRejectedValue(
      Object.assign(new Error("upstream temporarily unavailable"), {
        status: 503,
      }),
    );
    mocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify({
        plannerTopic: "Sichere Schulwege im Bezirk",
        plannerCore:
          "Eltern fordern sichere Querungen und verlässliche Kontrollen vor Schulen.",
        plannerScope: ["district"],
        plannerStance: "pro",
        plannerClusters: [
          "Schulwegsicherheit",
          "Sichere Querungen",
          "Kommunale Verkehrskontrollen",
        ],
        plannerOpenQuestions: ["Welche Schule und welche Querung sollen zuerst geprüft werden?"],
        shortSummary:
          "Der Beitrag fordert konkrete kommunale Maßnahmen für sichere Schulwege.",
        topicCandidates: ["Sichere Schulwege im Bezirk", "Schulwegsicherheit"],
        clusterCandidates: [
          "Schulwegsicherheit",
          "Sichere Querungen",
          "Kommunale Verkehrskontrollen",
        ],
        scopeCandidates: ["district"],
        openQuestions: ["Welche Schule und welche Querung sollen zuerst geprüft werden?"],
        graphSearchTerms: ["Schulwegsicherheit", "sichere Querungen", "Verkehrskontrollen"],
        materialSignals: [],
        recommendedLane: "create_fast_followup",
      }),
      model: "claude-sonnet-test",
    });

    const planner = await buildCreatePlanner({
      text:
        "Vor mehreren Schulen fehlen sichere Querungen. Eltern fordern außerdem verlässliche kommunale Verkehrskontrollen.",
      locale: "de",
      requestId: "fallback-run-1",
      operationId: "fallback-run-1",
    });

    expect(mocks.callOpenAIJson).toHaveBeenCalledTimes(1);
    expect(mocks.callAnthropic).toHaveBeenCalledTimes(1);
    expect(mocks.callMistral).not.toHaveBeenCalled();
    expect(planner.source).toBe("anthropic");
    expect(planner.plannerProvider).toBe("anthropic");
    expect(planner.providerAttemptCount).toBe(2);
    expect(planner.plannerDegraded).toBe(false);
    expect(planner.permissions.canPublish).toBe(false);
    expect(planner.permissions.canSave).toBe(false);
  });
});
