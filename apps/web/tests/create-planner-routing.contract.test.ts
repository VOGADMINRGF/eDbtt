import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
  buildCreatePlanner: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

vi.mock("@/features/create/createPlanner", () => ({
  buildCreatePlanner: (...args: unknown[]) => mocks.buildCreatePlanner(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";

describe("create planner routing contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses planner_only metadata for normal free text without mutative actions", async () => {
    mocks.buildCreatePlanner.mockResolvedValue({
      source: "openai",
      plannerTopic: "Tierschutz, Tierhaltung und Agrarstandards",
      plannerCore: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
      plannerScope: ["eu", "federal", "international"],
      plannerStance: "pro",
      plannerClusters: ["Tierwohl und Haltungsstandards", "Import- und Exportregeln"],
      plannerOpenQuestions: ["Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?"],
      shortSummary: "Der Beitrag fordert strengere Tierwohlstandards.",
      topicCandidates: ["Tierschutz, Tierhaltung und Agrarstandards", "Tierwohl"],
      clusterCandidates: ["Tierwohl und Haltungsstandards", "Import- und Exportregeln"],
      scopeCandidates: ["eu", "federal", "international"],
      stance: "pro",
      openQuestions: [
        "Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?",
        "Sollten importierte und exportierte Tierprodukte nur zugelassen werden, wenn vergleichbare Tierwohlstandards eingehalten werden?",
      ],
      graphSearchTerms: ["Tierwohl", "Import Export Tierprodukte"],
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
    });
    mocks.analyzeContribution.mockResolvedValue({
      mode: "E150",
      sourceText: null,
      language: "de",
      claims: [
        {
          id: "c1",
          text: "Es braucht bessere Standards.",
          topic: "Öffentliches Anliegen",
          domain: "politik",
          domains: ["politik"],
          stance: "pro",
          statementType: "interpretation",
          importance: 3,
        },
      ],
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
        summary: "Generische Analyse.",
        keyConflicts: [],
        facts: { local: [], international: [] },
        openQuestions: [],
        takeaways: [],
      },
    });

    const result = await buildCreateIntelligentFollowup({
      text: "Ich bin für bessere Tierwohlstandards.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.meta?.planner.source).toBe("openai");
    expect(result.meta?.planner.providerPlan.plannerRole).toBe("planner_only");
    expect(result.meta?.planner.permissions.nonMutative).toBe(true);
    expect(result.meta?.planner.permissions.canPublish).toBe(false);
    expect(result.meta?.planner.permissions.canSave).toBe(false);
    expect(result.meta?.planner.permissions.canMerge).toBe(false);
    expect(result.meta?.planner.permissions.canDeepSearch).toBe(false);
    expect(result.meta?.researchUsed).toBe("none");
    expect(result.meta?.researchProvider).toBeNull();
    expect(result.meta?.deepSearchUsed).toBe(false);
    expect(result.meta?.graphMatch.stage).toBe("after_structure");
    expect(result.meta?.graphMatch.requiresConfirmation).toBe(true);
    expect(result.meta?.graphMatch.searchTerms).toEqual(expect.arrayContaining(["Tierwohl"]));
    expect(result.understanding.topics[0]?.label).toBe("Tierschutz, Tierhaltung und Agrarstandards");
    expect(result.understanding.statements[0]?.text).toBe("Forderung nach besseren Tierschutz- und Tierhaltungsstandards");
  });
});
