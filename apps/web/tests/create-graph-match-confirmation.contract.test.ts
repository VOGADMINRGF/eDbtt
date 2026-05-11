import { describe, expect, it } from "vitest";

import { buildCreateHandoffDraft } from "@/features/create/createHandoff";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";

const DUPLICATE_RISK_FIXTURE: CreateIntelligentFollowupResult = {
  sourceText: "Tierwohlstandards sollen entlang von Import und Export vergleichbar werden.",
  generatedAt: "2026-05-10T12:00:00.000Z",
  degraded: false,
  degradedReason: null,
  understanding: {
    summary: "Tierwohl-Standards werden als politischer Regelungsbedarf beschrieben.",
    topics: [
      {
        id: "topic-1",
        label: "Tierschutz, Tierhaltung und Agrarstandards",
        confidence: "high",
      },
    ],
    categories: [
      {
        id: "demand",
        label: "Forderung",
        confidence: "high",
      },
    ],
    statements: [
      {
        id: "statement-1",
        text: "Importierte Tierprodukte sollten nur zugelassen werden, wenn vergleichbare Tierwohlstandards gelten.",
        kind: "demand",
        stance: "pro",
        confidence: "high",
      },
    ],
    scopes: ["eu", "international"],
    positionClusters: [
      {
        id: "cluster-1",
        label: "pragmatisch/abwägend",
        confidence: "medium",
      },
    ],
    openQuestion: "Welche Standards und Kontrollen gelten bereits?",
    confidence: "high",
  },
  suggestions: [],
  meta: {
    planner: {
      source: "heuristic_fallback",
      plannerTopic: "Tierschutz, Tierhaltung und Agrarstandards",
      plannerCore: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
      plannerScope: ["eu", "international"],
      plannerStance: "pro",
      plannerClusters: ["Tierwohl und Haltungsstandards"],
      plannerOpenQuestions: ["Welche Standards und Kontrollen gelten bereits?"],
      shortSummary: "Der Text fordert strengere Tierwohlregeln entlang von Import und Export.",
      topicCandidates: ["Tierschutz, Tierhaltung und Agrarstandards"],
      clusterCandidates: ["Tierwohl und Haltungsstandards"],
      scopeCandidates: ["eu", "international"],
      stance: "pro",
      openQuestions: ["Welche Standards und Kontrollen gelten bereits?"],
      graphSearchTerms: ["Tierwohlstandards", "Importregeln"],
      materialSignals: [],
      recommendedLane: "create_fast_followup",
      providerPlan: {
        lane: "create_fast_followup",
        plannerProvider: null,
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
    },
    graphMatch: {
      stage: "after_structure",
      prepared: true,
      requiresConfirmation: true,
      searchTerms: ["Tierwohlstandards", "Importregeln"],
      matches: [
        {
          id: "match-1",
          kind: "topic",
          label: "Tierwohlstandards",
          relation: "duplicate_risk",
          requiresConfirmation: true,
        },
        {
          id: "match-2",
          kind: "claim",
          label: "Importregeln",
          relation: "related",
          requiresConfirmation: true,
        },
      ],
      matchedTopics: [],
      matchedDossiers: [],
      matchedClaims: [],
      matchedAnlassraeume: [],
      matchedVotes: [],
      shouldCreateNewTopic: false,
    },
    researchUsed: "none",
    researchProvider: null,
    deepSearchUsed: false,
  },
};

describe("create graph match confirmation contract", () => {
  it("keeps graph matches confirmation-bound and routes duplicate risk into review", () => {
    const draft = buildCreateHandoffDraft({
      result: DUPLICATE_RISK_FIXTURE,
      selectedAction: "append_to_dossier",
      id: "graph-review-1",
    });

    expect(draft.graphMatches.matches.length).toBeGreaterThan(0);
    expect(draft.graphMatches.matches.every((match) => match.requiresConfirmation)).toBe(true);
    expect(draft.graphMatches.matches[0]?.relation).toBe("duplicate_risk");
    expect(draft.reviewState).toBe("graph_review_required");
    expect(draft.graphMatches.shouldCreateNewTopic).toBe(false);
  });
});
