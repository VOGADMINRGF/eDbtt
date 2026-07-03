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

describe("create planner openai happy path contract", () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiKey;
  });

  it("keeps a concrete equality and quota planner result as non-degraded openai output", async () => {
    mocks.callOpenAIJson.mockResolvedValue({
      text: JSON.stringify({
        plannerTopic: "Gleichberechtigung, Frauenquote und Minderheitenförderung",
        plannerCore:
          "Gemischte Position: Kritik an einer reinen Frauenquote, aber Unterstützung für breitere Gleichberechtigung und faire Regeln für verschiedene Minderheiten.",
        plannerScope: ["federal"],
        plannerStance: "mixed",
        plannerClusters: [
          "Frauenquote und Gleichberechtigung",
          "Minderheitenförderung und Repräsentation",
          "Quotenregelungen in Unternehmen",
          "wirtschaftliche Auswirkungen",
        ],
        plannerOpenQuestions: [
          "Soll zuerst über Gleichberechtigung, Quotenmodelle oder Unternehmensfolgen gesprochen werden?",
        ],
        shortSummary:
          "Der Beitrag trennt Gleichberechtigung von der konkreten Frauenquote und verbindet das mit Minderheitenförderung und Unternehmensfolgen.",
        topicCandidates: [
          "Gleichberechtigung, Frauenquote und Minderheitenförderung",
          "Gleichberechtigung",
          "Frauenquote",
          "Minderheitenförderung",
        ],
        clusterCandidates: [
          "Frauenquote und Gleichberechtigung",
          "Minderheitenförderung und Repräsentation",
          "Quotenregelungen in Unternehmen",
          "wirtschaftliche Auswirkungen",
        ],
        scopeCandidates: ["federal"],
        openQuestions: [
          "Soll zuerst über Gleichberechtigung, Quotenmodelle oder Unternehmensfolgen gesprochen werden?",
        ],
        graphSearchTerms: [
          "Gleichberechtigung",
          "Frauenquote",
          "Minderheitenförderung",
          "Quoten Unternehmen",
          "wirtschaftliche Auswirkungen Quoten",
        ],
        materialSignals: [],
        recommendedLane: "create_fast_followup",
      }),
    });

    const planner = await buildCreatePlanner({
      text:
        "ich bin gegen frauenquote aber für mehr gleichberechtigung. gibt es eine frauenquote müsste es auch quoten von anderen minderheiten geben, das kann nicht richtig und wirtschaftlich für ein unternehmen sein.",
      locale: "de",
      requestId: "request-1",
      operationId: "operation-1",
      dossierId: "dossier-1",
      userId: "user-1",
    });

    expect(planner.source).toBe("openai");
    expect(planner.plannerSource).toBe("openai");
    expect(planner.plannerDegraded).toBe(false);
    expect(planner.plannerProvider).toBe("openai");
    expect(planner.plannerRole).toBe("planner_only");
    expect(planner.plannerTopic).toContain("Gleichberechtigung");
    expect(planner.plannerTopic).toContain("Frauenquote");
    expect(planner.plannerClusters).toEqual(
      expect.arrayContaining([
        "Frauenquote und Gleichberechtigung",
        "Minderheitenförderung und Repräsentation",
        "Quotenregelungen in Unternehmen",
        "wirtschaftliche Auswirkungen",
      ]),
    );
    expect(planner.graphSearchTerms).toEqual(
      expect.arrayContaining(["Gleichberechtigung", "Frauenquote", "Minderheitenförderung"]),
    );
    expect(planner.qualityStatus).toBe("specific");
    expect(planner.plannerDebug.usedProvider).toBe("openai");
    expect(planner.plannerDebug.rawPayloadValid).toBe(true);
    expect(planner.plannerDebug.normalizedPayloadValid).toBe(true);
    expect(planner.plannerDebug.qualityGatePassed).toBe(true);
    expect(mocks.logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai",
        pipeline: "other",
        operationId: "operation-1",
        operationType: "create_intelligent_followup_planner",
        requestId: "request-1",
        dossierId: "dossier-1",
        userId: "user-1",
        success: true,
      }),
    );
  });
});
