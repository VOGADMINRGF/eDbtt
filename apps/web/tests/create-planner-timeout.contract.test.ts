import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callOpenAIJson: vi.fn(),
  logAiUsage: vi.fn(),
}));

vi.mock("@features/ai", () => ({
  callOpenAIJson: (...args: unknown[]) => mocks.callOpenAIJson(...args),
}));

vi.mock("@core/telemetry/aiUsage", () => ({
  logAiUsage: (...args: unknown[]) => mocks.logAiUsage(...args),
}));

import { buildCreatePlanner } from "@/features/create/createPlanner";

describe("create planner timeout contract", () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalPlannerTimeout = process.env.CREATE_PLANNER_TIMEOUT_MS;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.CREATE_PLANNER_TIMEOUT_MS = "25";
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiKey;
    if (originalPlannerTimeout === undefined) delete process.env.CREATE_PLANNER_TIMEOUT_MS;
    else process.env.CREATE_PLANNER_TIMEOUT_MS = originalPlannerTimeout;
  });

  it("returns a technical fallback quickly when planner_only openai call does not return", async () => {
    mocks.callOpenAIJson.mockImplementation(
      () => new Promise(() => undefined) as Promise<{ text: string }>,
    );

    const plannerPromise = buildCreatePlanner({
      text: "Ich bin für besseren Tierschutz und Tierhaltung in Europa und weltweit.",
      locale: "de",
      requestId: "request-timeout",
      operationId: "operation-timeout",
      dossierId: "dossier-timeout",
    });

    await vi.advanceTimersByTimeAsync(1_000);
    const planner = await plannerPromise;

    expect(mocks.callOpenAIJson).toHaveBeenCalledTimes(1);
    expect(planner.source).toBe("technical_fallback");
    expect(planner.recommendedLane).toBe("standard");
    expect(planner.providerPlan.plannerProvider).toBe("local_fallback");
    expect(planner.plannerDegraded).toBe(true);
    expect(planner.degradedReason).toBe("timeout");
    expect(planner.plannerTopic).toBe("Analyse noch nicht validiert");
    expect(planner.topicCandidates).toEqual([]);
    expect(planner.plannerDebug.attemptedProvider).toBe("openai");
    expect(planner.plannerDebug.providerAvailable).toBe(true);
    expect(planner.plannerDebug.errorMessage).toContain("create_planner_timeout_after_");
    expect(planner.permissions.nonMutative).toBe(true);
    expect(planner.permissions.canDeepSearch).toBe(false);
    expect(mocks.logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai",
        pipeline: "other",
        operationId: "operation-timeout",
        requestId: "request-timeout",
        dossierId: "dossier-timeout",
        success: false,
        errorKind: "TIMEOUT",
      }),
    );
  });
});
