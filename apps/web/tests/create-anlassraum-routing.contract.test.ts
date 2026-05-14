import { describe, expect, it } from "vitest";

import { resolveCreateAnlassraumTargetHref } from "@/app/create/CreateClient";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";

function buildFollowup(href: string): CreateIntelligentFollowupResult {
  return {
    understanding: {
      summary: "Kurzfassung",
      categories: [{ id: "claim", label: "Aussage", confidence: "high" }],
      topics: [{ id: "topic-1", label: "Tierschutz, Tierhaltung und Agrarstandards", confidence: "high" }],
      statements: [{ id: "statement-1", text: "Forderung nach besseren Standards", kind: "claim", stance: "pro", confidence: "high" }],
      scopes: ["eu", "international"],
      openQuestion: "Welche Standards sind gemeint?",
      confidence: "high",
    },
    suggestions: [
      {
        id: "new_anlassraum:auto",
        kind: "new_anlassraum",
        title: "Tierschutz, Tierhaltung und Agrarstandards",
        reason: "Noch kein vollständig passender nächster Schritt ist sicher genug.",
        confidence: "low",
        href,
        suggestedContributionKind: "claim",
        suggestedStance: "yes",
        requiresConfirmation: true,
      },
    ],
    sourceText: "Tierschutztext",
    generatedAt: "2026-05-11T08:00:00.000Z",
    meta: {
      planner: {
        source: "heuristic_fallback",
        plannerSource: "heuristic_fallback",
        plannerProvider: "local_fallback",
        plannerRole: "planner_only",
        plannerTopic: "Tierschutz, Tierhaltung und Agrarstandards",
        plannerCore: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
        plannerScope: ["eu", "international", "federal"],
        plannerStance: "pro",
        plannerClusters: ["Tierwohl und Haltungsstandards"],
        plannerOpenQuestions: ["Welche Standards sind gemeint?"],
        shortSummary: "Kurzfassung",
        topicCandidates: ["Tierschutz, Tierhaltung und Agrarstandards"],
        clusterCandidates: ["Tierwohl und Haltungsstandards"],
        scopeCandidates: ["eu", "international", "federal"],
        stance: "pro",
        openQuestions: ["Welche Standards sind gemeint?"],
        graphSearchTerms: ["Tierwohl"],
        materialSignals: [],
        recommendedLane: "create_fast_followup",
        providerPlan: {
          lane: "create_fast_followup",
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
        plannerDegraded: false,
        degradedReason: null,
        plannerDegradedReason: null,
        qualityStatus: "specific",
        qualityIssues: [],
        providerCallAttempted: false,
        providerCallSucceeded: false,
        plannerDebug: {
          attemptedProvider: "openai",
          usedProvider: "local_fallback",
          providerAvailable: false,
          providerErrorCode: null,
          providerErrorMessage: null,
          errorMessage: null,
          rawPayloadValid: false,
          rawTextValid: false,
          normalizedPayloadValid: false,
          qualityGatePassed: false,
        },
      },
      graphMatch: {
        stage: "after_structure",
        prepared: true,
        requiresConfirmation: true,
        searchTerms: ["Tierwohl"],
        matches: [],
        matchedTopics: [],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: [],
        matchedVotes: [],
        shouldCreateNewTopic: true,
      },
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
    },
    degraded: true,
    degradedReason: "create_followup_timeout_after_2800ms",
  };
}

describe("create anlassraum routing contract", () => {
  it("falls back to /runden when the suggested anlassraum href points back to /create", () => {
    expect(
      resolveCreateAnlassraumTargetHref(buildFollowup("/create?intent=contribute")),
    ).toBe("/runden?view=active&from=create&topic=Tierschutz%2C%20Tierhaltung%20und%20Agrarstandards");
  });

  it("keeps a direct /runden href when one is already provided", () => {
    expect(
      resolveCreateAnlassraumTargetHref(buildFollowup("/runden?view=active&anlassraumId=room-1")),
    ).toBe("/runden?view=active&anlassraumId=room-1");
  });
});
