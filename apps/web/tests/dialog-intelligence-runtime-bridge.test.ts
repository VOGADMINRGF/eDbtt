import { describe, expect, it } from "vitest";

import {
  blocksUnsafeDialogIntelligenceSideEffects,
  canRunDialogIntelligenceRuntime,
  fallbackToDialogIntelligencePreview,
  getDialogIntelligenceRuntimeBlockers,
  runDialogIntelligenceRuntime,
} from "@/features/create/dialogIntelligenceRuntimeBridge";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";

function buildFollowupResult(
  overrides: Partial<CreateIntelligentFollowupResult> = {},
): CreateIntelligentFollowupResult {
  return {
    understanding: {
      summary: "Du möchtest sichere Schulwege im Quartier verbessern.",
      dossierContext: "Sichere Schulwege",
      categories: [{ id: "hint", label: "Hinweis", confidence: "high" }],
      topics: [
        { id: "mobility", label: "Mobilität & Stadtentwicklung", confidence: "high" },
        { id: "community", label: "Kommunales & Lebensumfeld", confidence: "medium" },
      ],
      statements: [
        {
          id: "statement-1",
          text: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
          kind: "claim",
          stance: "pro",
          confidence: "high",
          sourceExcerpt: "Lokaler Hinweis mit Quellenbezug",
        },
      ],
      scopes: ["district"],
      openQuestion: "Welche Kreuzungen sind zuerst gemeint?",
      confidence: "high",
    },
    suggestions: [
      {
        id: "dossier:auto",
        kind: "dossier",
        title: "Sichere Schulwege",
        reason: "Das Thema passt zu einem bestehenden Arbeitsstand.",
        confidence: "high",
        href: "/dossier?topic=schulwege",
        requiresConfirmation: true,
      },
    ],
    sourceText:
      "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen. https://beispiel.de/bericht",
    generatedAt: "2026-06-29T10:00:00.000Z",
    meta: {
      planner: {
        source: "openai",
        plannerSource: "openai",
        plannerProvider: "openai",
        plannerRole: "planner_only",
        plannerTopic: "Sichere Schulwege",
        plannerCore: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
        plannerScope: ["district", "municipal"],
        plannerStance: "pro",
        plannerClusters: ["Mobilität"],
        plannerOpenQuestions: ["Welche Kreuzungen sind zuerst gemeint?"],
        shortSummary: "Du möchtest sichere Schulwege im Quartier verbessern.",
        topicCandidates: ["Sichere Schulwege"],
        clusterCandidates: ["Mobilität"],
        scopeCandidates: ["district", "municipal"],
        stance: "pro",
        openQuestions: ["Welche Kreuzungen sind zuerst gemeint?"],
        graphSearchTerms: ["Schulwege"],
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
          rawText: null,
        },
      },
      graphMatch: {
        stage: "after_structure",
        prepared: true,
        requiresConfirmation: true,
        searchTerms: ["Schulwege"],
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
    ...overrides,
  };
}

describe("dialog intelligence runtime bridge", () => {
  it("uses the existing planner-backed openai runtime when it is safely available", () => {
    const result = runDialogIntelligenceRuntime({
      result: buildFollowupResult(),
      isConfirmed: true,
    });

    expect(canRunDialogIntelligenceRuntime({ result: buildFollowupResult() })).toBe(true);
    expect(result.status).toBe("runtime_ai");
    expect(result.usedSources).toEqual(
      expect.arrayContaining([
        "create_planner_openai_runtime",
        "create_intelligent_followup_contract",
        "dialog_intelligence_contract",
      ]),
    );
    expect(result.sourceLabel).toBe("KI-Auswertung aus Runtime");
    expect(result.outcome.recognizedStandpoint.confirmedByUser).toBe(true);
    expect(result.outcome.arguments.every((argument) => argument.verificationStatus !== "reviewed")).toBe(true);
  });

  it("routes needs_source and factcheck hints through the existing dialog contract instead of confirming truth", () => {
    const result = runDialogIntelligenceRuntime({
      result: buildFollowupResult(),
    });

    expect(result.outcome.arguments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          verificationStatus: "needs_source",
        }),
      ]),
    );
    expect(result.outcome.handoffTargets).toContain("factcheck_request");
    expect(result.outcome.openQuestions).toContain(
      "Welche überprüfbaren Quellen oder Belege fehlen noch?",
    );
    expect(result.guardrails.noTruthConfirmation).toBe(true);
    expect(result.guardrails.noSourceInvention).toBe(true);
    expect(result.guardrails.noAutoPublish).toBe(true);
    expect(result.guardrails.noAutoGraph).toBe(true);
    expect(result.guardrails.noDeepSearch).toBe(true);
  });

  it("falls back honestly to preview when only heuristic or local planner output exists", () => {
    const previewResult = runDialogIntelligenceRuntime({
      result: buildFollowupResult({
        meta: {
          ...buildFollowupResult().meta!,
          planner: {
            ...buildFollowupResult().meta!.planner,
            source: "heuristic_fallback",
            plannerSource: "heuristic_fallback",
            plannerProvider: "local_fallback",
            providerCallAttempted: false,
            providerCallSucceeded: false,
            plannerDebug: {
              ...buildFollowupResult().meta!.planner.plannerDebug,
              usedProvider: "local_fallback",
              providerAvailable: false,
            },
          },
        },
      }),
    });

    expect(previewResult.status).toBe("preview");
    expect(previewResult.blockers).toContain("planner_not_runtime_ai");
    expect(previewResult.sourceLabel).toBe(
      "Preview-Auswertung – noch keine echte Runtime-KI",
    );
    expect(previewResult.usedSources).toContain(
      "dialog_intelligence_preview_mapper",
    );
  });

  it("reports blocked_unwired instead of fake runtime ai when planner wiring is missing", () => {
    const resultWithoutRuntime = buildFollowupResult({
      meta: undefined,
    });

    expect(canRunDialogIntelligenceRuntime({ result: resultWithoutRuntime })).toBe(false);
    expect(getDialogIntelligenceRuntimeBlockers({ result: resultWithoutRuntime })).toEqual(
      expect.arrayContaining([
        "missing_followup_planner",
        "missing_followup_graph_match",
        "unsafe_runtime_side_effects",
      ]),
    );

    const runtime = fallbackToDialogIntelligencePreview({
      result: resultWithoutRuntime,
    });

    expect(runtime.status).toBe("blocked_unwired");
    expect(runtime.sourceLabel).toBe("KI-Auswertung derzeit nicht verfügbar");
  });

  it("blocks unsafe side effects when a planner contract would allow deepsearch or mutations", () => {
    const unsafeResult = buildFollowupResult();
    unsafeResult.meta!.planner = {
      ...unsafeResult.meta!.planner,
      permissions: {
        ...(unsafeResult.meta!.planner.permissions as unknown as Record<string, unknown>),
        canDeepSearch: true,
      } as never,
    };

    expect(blocksUnsafeDialogIntelligenceSideEffects({ result: unsafeResult })).toBe(false);
    expect(getDialogIntelligenceRuntimeBlockers({ result: unsafeResult })).toContain(
      "unsafe_runtime_side_effects",
    );
  });
});
