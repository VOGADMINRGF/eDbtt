import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildCreatePlanner: vi.fn(),
}));

vi.mock("@/features/create/createPlanner", () => ({
  buildCreatePlanner: (...args: unknown[]) => mocks.buildCreatePlanner(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import {
  buildCreateStructureBranches,
  buildCreateVisualMap,
  buildCreateVisualSections,
} from "@/features/create/intelligentFollowupContract";

describe("create intelligent follow-up contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives validated understanding only from a specific openai planner result", async () => {
    mocks.buildCreatePlanner.mockResolvedValue({
      source: "openai",
      plannerSource: "openai",
      plannerProvider: "openai",
      plannerRole: "planner_only",
      plannerTopic: "ÖPNV und Mobilität",
      plannerCore:
        "Der Beitrag verbindet abendlichen Bus-Takt, Anschlussmobilität sowie Fragen zu Straßenraum, Parkraum und Radwegen.",
      plannerScope: ["district", "municipal"],
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
      scopeCandidates: ["district", "municipal"],
      stance: "open",
      openQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
      graphSearchTerms: ["öpnv", "straßenraum", "parkraum", "anschlussmobilität"],
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
      plannerDebug: {
        attemptedProvider: "openai",
        usedProvider: "openai",
        providerAvailable: true,
        providerErrorCode: null,
        providerErrorMessage: null,
        errorMessage: null,
        rawPayloadValid: true,
        rawTextValid: true,
        normalizedPayloadValid: true,
        qualityGatePassed: true,
      },
    });

    const result = await buildCreateIntelligentFollowup({
      text: "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.meta?.analysis?.state).toBe("result_ready");
    expect(result.meta?.analysis?.validationStatus).toBe("validated");
    expect(result.degraded).toBe(false);
    expect(result.understanding.topics.map((topic) => topic.label)).toEqual([
      "ÖPNV und Mobilität",
      "Straßenraum und Radverkehr",
      "Parkraum und kommunale Planung",
      "Pendler- und Anschlussmobilität",
    ]);
    expect(result.understanding.statements[0]?.text).toBe(
      "Der Beitrag verbindet abendlichen Bus-Takt, Anschlussmobilität sowie Fragen zu Straßenraum, Parkraum und Radwegen.",
    );

    const branches = buildCreateStructureBranches(result, 3);
    expect(branches).toHaveLength(3);
    expect(branches.map((branch) => branch.title)).toEqual([
      "ÖPNV und Mobilität",
      "Straßenraum und Radverkehr",
      "Parkraum und kommunale Planung",
    ]);

    const visualMap = buildCreateVisualMap(result);
    expect(visualMap.center.label).toBe("Dein Beitrag");
    expect(visualMap.nodes.some((node) => node.kind === "topic")).toBe(true);

    const sections = buildCreateVisualSections(result, 3);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.label.trim().length).toBeGreaterThan(0);
  });

  it("keeps non-validated planner runs on a technical ai_failed path", async () => {
    mocks.buildCreatePlanner.mockResolvedValue({
      source: "technical_fallback",
      plannerSource: "technical_fallback",
      plannerProvider: "local_fallback",
      plannerRole: "planner_only",
      plannerTopic: "Analyse noch nicht validiert",
      plannerCore: "Es liegt noch kein validierter KI-Run vor.",
      plannerScope: ["unclear"],
      plannerStance: "unclear",
      plannerClusters: [],
      plannerOpenQuestions: [],
      shortSummary: "Es liegt noch kein validierter KI-Run vor.",
      topicCandidates: [],
      clusterCandidates: [],
      scopeCandidates: ["unclear"],
      stance: "unclear",
      openQuestions: [],
      graphSearchTerms: [],
      materialSignals: [],
      recommendedLane: "standard",
      providerPlan: {
        lane: "standard",
        plannerProvider: "local_fallback",
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
      plannerDegraded: true,
      degradedReason: "timeout",
      plannerDegradedReason: "timeout",
      qualityStatus: "failed",
      qualityIssues: ["technical_fallback_only"],
      providerCallAttempted: true,
      providerCallSucceeded: false,
      plannerDebug: {
        attemptedProvider: "openai",
        usedProvider: "local_fallback",
        providerAvailable: true,
        providerErrorCode: null,
        providerErrorMessage: "create_planner_timeout_after_2200ms",
        errorMessage: "create_planner_timeout_after_2200ms",
        rawPayloadValid: false,
        rawTextValid: false,
        normalizedPayloadValid: false,
        qualityGatePassed: false,
      },
    });

    const result = await buildCreateIntelligentFollowup({
      text: "Bitte prüft diese Aussage zur Energieversorgung.",
      locale: "de",
      intent: "check",
    });

    expect(result.degraded).toBe(true);
    expect(result.meta?.analysis?.state).toBe("ai_failed");
    expect(result.meta?.analysis?.validationStatus).toBe("failed");
    expect(result.understanding.topics).toEqual([]);
    expect(result.understanding.statements).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(result.meta?.graphMatch.prepared).toBe(false);
    expect(buildCreateStructureBranches(result, 3)).toEqual([]);
  });
});
