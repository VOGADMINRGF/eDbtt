import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callOpenAIJson: vi.fn(),
}));

vi.mock("@features/ai", () => ({
  callOpenAIJson: (...args: unknown[]) => mocks.callOpenAIJson(...args),
}));

import { buildCreatePlanner } from "@/features/create/createPlanner";

describe("create planner debug diagnostics contract", () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;
  const originalOpenAiPlannerModel = process.env.OPENAI_PLANNER_MODEL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-5";
    delete process.env.OPENAI_PLANNER_MODEL;
  });

  afterEach(() => {
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiKey;
    if (originalOpenAiModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalOpenAiModel;
    if (originalOpenAiPlannerModel === undefined) delete process.env.OPENAI_PLANNER_MODEL;
    else process.env.OPENAI_PLANNER_MODEL = originalOpenAiPlannerModel;
  });

  it("falls back to OPENAI_MODEL when OPENAI_PLANNER_MODEL returns MODEL_NOT_FOUND", async () => {
    process.env.OPENAI_PLANNER_MODEL = "gpt-4.1-mini";
    process.env.OPENAI_MODEL = "gpt-5";
    mocks.callOpenAIJson
      .mockRejectedValueOnce(new Error("404 model not found"))
      .mockResolvedValueOnce({
        text: JSON.stringify({
          plannerTopic: "ÖPNV und Mobilität",
          plannerCore:
            "Der Beitrag verbindet Bus-Takt, Anschlussmobilität, Straßenraum, Parkraum und Radwege.",
          plannerScope: ["district"],
          plannerStance: "open",
          plannerClusters: [
            "ÖPNV und Mobilität",
            "Straßenraum und Radverkehr",
            "Parkraum und kommunale Planung",
            "Pendler- und Anschlussmobilität",
          ],
          plannerOpenQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
          shortSummary:
            "Der Beitrag verknüpft Bus-Takt, Anschlussmobilität, Straßenumbau, Parkraum und Radwege.",
          topicCandidates: [
            "ÖPNV und Mobilität",
            "Straßenraum und Radverkehr",
            "Parkraum und kommunale Planung",
            "Pendler- und Anschlussmobilität",
          ],
          clusterCandidates: [
            "ÖPNV und Mobilität",
            "Straßenraum und Radverkehr",
            "Parkraum und kommunale Planung",
            "Pendler- und Anschlussmobilität",
          ],
          scopeCandidates: ["district"],
          openQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
          graphSearchTerms: ["Bus-Takt", "Anschlussmobilität", "Straßenraum", "Parkraum"],
          materialSignals: [],
          recommendedLane: "create_fast_followup",
        }),
      });

    const planner = await buildCreatePlanner({
      text:
        "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten. Dadurch verpassen viele Beschäftigte den Anschluss an die S-Bahn. Gleichzeitig soll die Hauptstraße umgebaut werden, aber niemand weiß, ob dabei Parkplätze wegfallen oder neue Radwege entstehen.",
      locale: "de",
    });

    expect(mocks.callOpenAIJson).toHaveBeenCalledTimes(2);
    expect(mocks.callOpenAIJson.mock.calls[0]?.[0]).toMatchObject({ model: "gpt-4.1-mini" });
    expect(mocks.callOpenAIJson.mock.calls[1]?.[0]).toMatchObject({ model: "gpt-5" });
    expect(planner.source).toBe("openai");
    expect(planner.plannerDegraded).toBe(false);
    expect(planner.degradedReason).toBeNull();
    expect(planner.plannerDebug.usedModel).toBe("gpt-5");
  });

  it("surfaces provider_error when the OpenAI call throws", async () => {
    mocks.callOpenAIJson.mockRejectedValue(new Error("upstream exploded"));

    const planner = await buildCreatePlanner({
      text: "Ein längerer politischer Beitrag mit mehreren Themen.",
      locale: "de",
    });

    expect(planner.source).toBe("technical_fallback");
    expect(planner.plannerSource).toBe("technical_fallback");
    expect(planner.plannerDegraded).toBe(true);
    expect(planner.degradedReason).toBe("provider_error");
    expect(planner.plannerDegradedReason).toBe("provider_error");
    expect(planner.plannerDebug.errorMessage).toContain("upstream exploded");
    expect(planner.plannerDebug.providerErrorMessage).toContain("upstream exploded");
    expect(planner.plannerDebug.providerAvailable).toBe(true);
    expect(planner.plannerDebug.qualityGatePassed).toBe(false);
  });

  it("surfaces missing_provider_key when no OpenAI key is configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const planner = await buildCreatePlanner({
      text: "Ein längerer politischer Beitrag mit mehreren Themen.",
      locale: "de",
    });

    expect(planner.degradedReason).toBe("missing_provider_key");
    expect(planner.plannerDebug.providerAvailable).toBe(false);
    expect(planner.plannerDebug.usedProvider).toBe("local_fallback");
  });

  it("surfaces invalid_json when the provider returns non-json text", async () => {
    mocks.callOpenAIJson.mockResolvedValue({
      text: "kein json",
    });

    const planner = await buildCreatePlanner({
      text: "Ein längerer politischer Beitrag mit mehreren Themen.",
      locale: "de",
    });

    expect(planner.degradedReason).toBe("invalid_json");
    expect(planner.plannerDebug.rawPayloadValid).toBe(false);
    expect(planner.plannerDebug.rawTextValid).toBe(false);
    expect(planner.plannerDebug.rawText).toBe("kein json");
  });

  it("surfaces invalid_provider_payload when plannerCore is missing", async () => {
    mocks.callOpenAIJson.mockResolvedValue({
      text: JSON.stringify({
        plannerTopic: "Grundrechte",
        plannerScope: ["federal"],
      }),
    });

    const planner = await buildCreatePlanner({
      text: "Ein längerer politischer Beitrag mit mehreren Themen.",
      locale: "de",
    });

    expect(planner.degradedReason).toBe("invalid_provider_payload");
    expect(planner.plannerDebug.normalizedPayloadValid).toBe(false);
    expect(planner.plannerDebug.errorMessage).toContain("plannerCore fehlt");
    expect(planner.plannerDebug.providerErrorMessage).toContain("plannerCore fehlt");
  });

  it("surfaces quality_gate_failed for generic provider labels", async () => {
    mocks.callOpenAIJson.mockResolvedValue({
      text: JSON.stringify({
        plannerTopic: "Öffentliches Anliegen mit Klärungsbedarf",
        plannerCore: "Aussage",
        plannerScope: ["unclear"],
        plannerStance: "open",
        plannerClusters: [],
        plannerOpenQuestions: ["Was genau soll geklärt werden?"],
        shortSummary: "Kurzfassung",
        topicCandidates: ["Öffentliches Anliegen mit Klärungsbedarf"],
        clusterCandidates: [],
        scopeCandidates: ["unclear"],
        openQuestions: ["Was genau soll geklärt werden?"],
        graphSearchTerms: ["Öffentliches Anliegen"],
        materialSignals: [],
        recommendedLane: "standard",
      }),
    });

    const planner = await buildCreatePlanner({
      text:
        "Ich bin schon für die Würde des Menschen, aber stelle dessen Legitimation in Frage. Ich bin für offene Grenzen und regionale Abstimmungen.",
      locale: "de",
    });

    expect(planner.degradedReason).toBe("quality_gate_failed");
    expect(planner.plannerDebug.normalizedPayloadValid).toBe(true);
    expect(planner.plannerDebug.errorMessage).toContain("qualityStatus=");
    expect(planner.plannerDebug.qualityGatePassed).toBe(false);
  });

  it("keeps plannerDegraded false for valid planner json", async () => {
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
    });

    expect(planner.source).toBe("openai");
    expect(planner.plannerSource).toBe("openai");
    expect(planner.plannerDegraded).toBe(false);
    expect(planner.degradedReason).toBeNull();
    expect(planner.plannerDegradedReason).toBeNull();
    expect(planner.plannerDebug.usedProvider).toBe("openai");
    expect(planner.plannerDebug.rawPayloadValid).toBe(true);
    expect(planner.plannerDebug.rawTextValid).toBe(true);
    expect(planner.plannerDebug.normalizedPayloadValid).toBe(true);
    expect(planner.plannerDebug.qualityGatePassed).toBe(true);
  });
});
