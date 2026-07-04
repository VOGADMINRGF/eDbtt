import { describe, expect, it } from "vitest";

import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";

function buildFollowupWithRuntimeTargets() {
  return {
    understanding: {
      summary: "Kurzfassung",
      categories: [{ id: "claim", label: "Aussage", confidence: "medium" as const }],
      topics: [{ id: "topic-1", label: "Schulwege", confidence: "medium" as const }],
      statements: [
        {
          id: "statement-1",
          text: "Die Stadt sollte sichere Schulwege priorisieren.",
          kind: "claim" as const,
          stance: "pro" as const,
          confidence: "medium" as const,
        },
      ],
      scopes: ["district" as const],
      openQuestion: "Welche Kreuzung zuerst?",
      confidence: "medium" as const,
    },
    suggestions: [],
    sourceText: "Sichere Schulwege und klare Prioritäten im Kiez.",
    generatedAt: "2026-07-04T10:00:00.000Z",
    degraded: false,
    degradedReason: null,
    meta: {
      planner: {
        source: "openai" as const,
        plannerSource: "openai" as const,
        plannerProvider: "openai" as const,
        plannerRole: "planner_only" as const,
        plannerTopic: "Sichere Schulwege",
        plannerCore: "Die Stadt sollte sichere Schulwege priorisieren.",
        plannerScope: ["district" as const],
        plannerStance: "pro" as const,
        plannerClusters: ["Mobilität"],
        plannerOpenQuestions: ["Welche Kreuzung zuerst?"],
        shortSummary: "Kurzfassung",
        topicCandidates: ["Sichere Schulwege"],
        clusterCandidates: ["Mobilität"],
        scopeCandidates: ["district" as const],
        stance: "pro" as const,
        openQuestions: ["Welche Kreuzung zuerst?"],
        graphSearchTerms: ["Schulwege"],
        materialSignals: [],
        recommendedLane: "create_fast_followup" as const,
        providerPlan: {
          lane: "create_fast_followup" as const,
          plannerProvider: "openai" as const,
          plannerRole: "planner_only" as const,
          structureProvider: "mistral" as const,
          summaryProvider: "claude" as const,
          researchUsed: "none" as const,
          researchProvider: null,
          deepSearchUsed: false,
          graphMatch: "after_structure" as const,
        },
        permissions: {
          nonMutative: true as const,
          canPublish: false as const,
          canSave: false as const,
          canMerge: false as const,
          canDeepSearch: false as const,
        },
        plannerDegraded: false,
        degradedReason: null,
        plannerDegradedReason: null,
        qualityStatus: "specific" as const,
        qualityIssues: [],
        providerCallAttempted: true,
        providerCallSucceeded: true,
        plannerDebug: {
          attemptedProvider: "openai" as const,
          usedProvider: "openai" as const,
          providerAvailable: true,
          providerErrorCode: null,
          providerErrorMessage: null,
          errorMessage: null,
          rawPayloadValid: true,
          rawTextValid: true,
          normalizedPayloadValid: true,
          qualityGatePassed: true,
        },
      },
      graphMatch: {
        stage: "after_structure" as const,
        prepared: true,
        requiresConfirmation: true as const,
        searchTerms: ["Schulwege"],
        matches: [
          {
            id: "topic-existing-1",
            kind: "topic" as const,
            label: "Sichere Schulwege",
            relation: "same" as const,
            requiresConfirmation: true as const,
          },
          {
            id: "anlassraum-existing-1",
            kind: "anlassraum" as const,
            label: "Anlassraum Sichere Schulwege",
            relation: "related" as const,
            requiresConfirmation: true as const,
          },
        ],
        matchedTopics: ["Sichere Schulwege"],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: ["anlassraum-existing-1"],
        matchedVotes: [],
        shouldCreateNewTopic: false,
      },
      researchUsed: "none" as const,
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
}

describe("create dossier graph anlassraum handoff contract", () => {
  it("keeps real target ids only when existing graph or anlassraum matches are truly present", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupWithRuntimeTargets(),
      createAnalyze: {
        schemaVersion: "create_analyze.v1",
        orchestrator: "create_orchestration",
        runId: "run-123",
        inputRef: "run-123",
        intent: "contribute",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        inputType: "free_text",
        intakeClassification: "free_text",
        languages: ["de"],
        normalizedInputSummary: "Mehr sichere Schulwege",
        claims: [{ id: "claim-1", text: "Die Stadt sollte sichere Schulwege priorisieren." }],
        questions: [{ id: "question-1", text: "Welche Kreuzung zuerst?" }],
        missingPerspectives: [],
        participationCandidates: [{ id: "poll-1", text: "Welche Maßnahme soll zuerst kommen?" }],
        nonCheckableOpinions: [],
        evidenceNeeds: [],
        uncertainties: [],
        matches: [],
        matchStrength: "none",
        reasons: ["Kein Match"],
        suggestedCtas: [{ id: "neu_anlegen", label: "Neu anlegen", reason: "Fallback" }],
        matchSourceState: "ok",
        matchSourceErrors: [],
        matchingLanguageMode: "same_language_only",
        phases: {
          intake: { status: "done", summary: "ok" },
          quality: { status: "review_required", summary: "ok" },
          graph_matching: { status: "done", summary: "ok" },
          cta_suggestions: { status: "done", summary: "ok" },
        },
        confidence: 0.8,
        uncertaintyFlags: [],
        requiresHumanReview: true,
        reviewRecommended: true,
        noAutoPublish: true,
        noSilentMerge: true,
        provenanceRefs: ["run-123"],
        createdAt: "2026-07-04T10:00:00.000Z",
      },
      draftId: "65a111111111111111111122",
      persistedReviewRecord: {
        reviewRecordId: "persisted-create-handoff-graph-1",
        selectedAction: "create_dossier",
        sourceText: "Sichere Schulwege und klare Prioritäten im Kiez.",
        dossierRuntime: {
          sourceReviewItemId: "persisted-create-handoff-graph-1",
          dossierRuntimeId: "dossier-runtime:persisted-create-handoff-graph-1",
          runtimeStatus: "queued_for_review",
          dossierRuntimeState: "dossier_review_draft",
          dossierTargetState: "dossier_review_draft",
          persistenceState: "persisted_dossier_runtime_record",
          reviewState: "review_required",
          publishState: "not_published",
          graphTargetState: "planned_not_active",
          auditRef: "audit-graph-1",
          missingRuntimeTruth: [],
        },
      },
    });

    expect(model.claimToDossierPipeline.dossierGraphAnlassraumHandoff).toMatchObject({
      sourceDossierRuntimeId: "dossier-runtime:persisted-create-handoff-graph-1",
      targetGraphId: "topic-existing-1",
      targetAnlassraumId: "anlassraum-existing-1",
      targetParticipationSpaceId: null,
      graphTargetState: "graph_candidate",
      anlassraumTargetState: "anlassraum_candidate",
      participationTargetState: "participation_candidate",
      branchWorkspaceTargetState: "branch_workspace_candidate",
      reviewState: "review_required",
      publishState: "not_published",
    });
    expect(
      model.claimToDossierPipeline.dossierGraphAnlassraumHandoff?.graphMatches.map(
        (item) => item.id,
      ),
    ).toEqual(["topic-existing-1", "anlassraum-existing-1"]);
    expect(
      model.claimToDossierPipeline.dossierGraphAnlassraumHandoff?.missingRuntimeTruth,
    ).toContain("topic_graph_edge_mutation_not_created_yet");
    expect(
      model.claimToDossierPipeline.dossierGraphAnlassraumHandoff?.missingRuntimeTruth,
    ).not.toContain("missing_graph_runtime_truth");
    expect(
      model.claimToDossierPipeline.dossierGraphAnlassraumHandoff?.missingRuntimeTruth,
    ).not.toContain("missing_anlassraum_runtime_truth");
  });
});
