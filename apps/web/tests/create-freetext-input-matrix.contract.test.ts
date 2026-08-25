import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildCreatePlanner: vi.fn(),
}));

vi.mock("@/features/create/createPlanner", () => ({
  buildCreatePlanner: (...args: unknown[]) => mocks.buildCreatePlanner(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";

function plannerFixture(topics: string[]) {
  return {
    source: "openai",
    plannerSource: "openai",
    plannerProvider: "openai",
    plannerRole: "planner_only",
    plannerTopic: topics[0],
    plannerCore: `Der Beitrag behandelt ${topics.join(", ")} als nachvollziehbare Arbeitsstruktur.`,
    plannerScope: ["federal"],
    plannerStance: "open",
    plannerClusters: topics,
    plannerOpenQuestions: [],
    shortSummary: `Struktur zu ${topics.join(", ")}.`,
    topicCandidates: topics,
    clusterCandidates: topics,
    scopeCandidates: ["federal"],
    stance: "open",
    openQuestions: [],
    graphSearchTerms: topics,
    materialSignals: [],
    recommendedLane: "create_fast_followup",
    providerPlan: {
      lane: "create_fast_followup",
      plannerProvider: "openai",
      plannerRole: "planner_only",
      structureProvider: "mistral",
      summaryProvider: "claude",
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
      graphMatch: "after_structure",
    },
    permissions: {
      nonMutative: true,
      canPublish: false,
      canSave: false,
      canMerge: false,
      canDeepSearch: false,
    },
    plannerDegraded: false,
    degradedReason: null,
    plannerDegradedReason: null,
    qualityStatus: "specific",
    qualityIssues: [],
    providerCallAttempted: true,
    providerCallSucceeded: true,
    providerAttemptCount: 1,
    providerAttempts: [
      {
        attempt: 1,
        provider: "openai",
        model: "gpt-test",
        status: "succeeded",
        resultCode: "ok",
        responseLength: 320,
        responseHash: "a".repeat(64),
      },
    ],
    plannerDebug: {
      attemptedProvider: "openai",
      usedProvider: "openai",
      attemptedModel: "gpt-test",
      usedModel: "gpt-test",
      attemptNumber: 1,
      providerAvailable: true,
      providerErrorCode: null,
      providerErrorMessage: null,
      errorMessage: null,
      rawPayloadValid: true,
      rawTextValid: true,
      normalizedPayloadValid: true,
      qualityGatePassed: true,
    },
  };
}

describe("/create freetext input matrix", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    {
      label: "short single-topic contribution",
      text: "Der Schulweg braucht eine sichere Querung.",
      topics: ["Schulwegsicherheit"],
    },
    {
      label: "multi-topic contribution",
      text: "Wir brauchen sichere Schulwege, bezahlbare Wohnungen und einen besseren Busverkehr.",
      topics: ["Schulwegsicherheit", "Bezahlbares Wohnen", "ÖPNV"],
    },
    {
      label: "long political program text",
      text: `${"Das Programm verbindet Grundrechte, Migration, Energiepolitik, Beteiligung und Budgetprioritäten. ".repeat(40)}`,
      topics: [
        "Grundrechte",
        "Migration",
        "Energiepolitik",
        "Bürgerbeteiligung",
        "Budgetprioritäten",
      ],
    },
  ])("builds a validated structure for $label", async ({ text, topics }) => {
    mocks.buildCreatePlanner.mockResolvedValueOnce(plannerFixture(topics));

    const result = await buildCreateIntelligentFollowup({ text, locale: "de" });

    expect(result.meta?.analysis).toMatchObject({
      state: "result_ready",
      sourceType: "text",
      sourceUrl: null,
      sourceLoaded: true,
      validationStatus: "validated",
      evidenceReferences: [],
    });
    expect(result.understanding.topics.map((topic) => topic.label)).toEqual(topics);
    expect(result.understanding.statements).toHaveLength(1);
    expect(result.meta?.planner?.providerAttempts).toEqual([
      expect.objectContaining({
        attempt: 1,
        provider: "openai",
        model: "gpt-test",
        status: "succeeded",
      }),
    ]);
    expect(JSON.stringify(result.meta?.planner?.providerAttempts)).not.toContain(text);
    expect(result.degraded).toBe(false);
    expect(result.degradedReason).toBeNull();
  });
});
