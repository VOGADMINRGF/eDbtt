import { describe, expect, it } from "vitest";
import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";

function buildFollowupFixture() {
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
        {
          id: "statement-2",
          text: "Dabei darf der Lieferverkehr nicht aus dem Blick geraten.",
          kind: "argument" as const,
          stance: "mixed" as const,
          confidence: "medium" as const,
        },
      ],
      scopes: ["district" as const],
      openQuestion: "Welche Kreuzung zuerst?",
      confidence: "medium" as const,
    },
    suggestions: [
      {
        id: "vote-1",
        kind: "vote" as const,
        title: "Welche Maßnahme soll zuerst kommen?",
        reason: "Beteiligungsfrage erkannt.",
        confidence: "medium" as const,
        requiresConfirmation: true as const,
      },
    ],
    sourceText: "Sichere Schulwege und klare Prioritäten im Kiez.",
    generatedAt: "2026-07-03T14:00:00.000Z",
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
        matches: [],
        matchedTopics: [],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: [],
        matchedVotes: [],
        shouldCreateNewTopic: false,
      },
      researchUsed: "none" as const,
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
}

describe("create claim-to-dossier pipeline contract", () => {
  it("maps non-poll candidates to the dossier runtime path and leaves polls planned", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupFixture(),
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
        missingPerspectives: [{ id: "counter-1", text: "Auch Lieferverkehr und Gewerbezugang müssen berücksichtigt werden." }],
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
        createdAt: "2026-07-03T14:00:00.000Z",
      },
      draftId: "65a111111111111111111122",
      sourceUrls: ["https://example.org/schulwege"],
      materialItems: [],
    });

    const dossierItems = model.claimToDossierPipeline.items.filter(
      (item) => item.candidateType !== "poll",
    );
    const pollItem = model.claimToDossierPipeline.items.find(
      (item) => item.candidateType === "poll",
    );

    expect(model.claimToDossierPipeline.hasPreparedPipeline).toBe(true);
    expect(model.claimToDossierPipeline.dossierDraftPreview).not.toBeNull();
    expect(dossierItems.length).toBeGreaterThan(0);
    expect(dossierItems.every((item) => item.targetCarrier === "dossier_runtime_record")).toBe(true);
    expect(dossierItems.every((item) => item.targetState === "dossier_handoff_prepared")).toBe(
      true,
    );
    expect(
      dossierItems.every((item) => item.persistenceState === "missing_persistence_truth"),
    ).toBe(true);
    expect(
      dossierItems.every((item) => item.missingRuntimeTruth.includes("candidate_handoff_not_persisted")),
    ).toBe(true);
    expect(pollItem).toMatchObject({
      targetCarrier: "participation_space_runtime_record",
      targetState: "planned_handoff",
      participationTargetState: "planned_handoff",
      persistenceState: "missing_persistence_truth",
    });
    expect(model.claimToDossierPipeline.dossierRuntimeHandoff).toMatchObject({
      dossierRuntimeId: null,
      dossierRuntimeState: "dossier_handoff_prepared",
      dossierTargetState: "dossier_handoff_prepared",
      persistenceState: "missing_dossier_runtime_truth",
    });
    expect(model.claimToDossierPipeline.dossierDraftPreview?.summary).toContain("Aussagen");
  });

  it("uses the existing persisted create handoff record as review-first runtime input when available", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupFixture(),
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
        missingPerspectives: [{ id: "counter-1", text: "Auch Lieferverkehr und Gewerbezugang müssen berücksichtigt werden." }],
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
        createdAt: "2026-07-03T14:00:00.000Z",
      },
      draftId: "65a111111111111111111122",
      sourceUrls: ["https://example.org/schulwege"],
      materialItems: [],
      persistedReviewRecord: {
        reviewRecordId: "persisted-create-handoff-1",
        selectedAction: "create_dossier",
        sourceText: "Sichere Schulwege und klare Prioritäten im Kiez.",
        dossierRuntime: {
          sourceReviewItemId: "persisted-create-handoff-1",
          dossierRuntimeId: "dossier-runtime:persisted-create-handoff-1",
          runtimeStatus: "queued_for_review",
          dossierRuntimeState: "dossier_review_draft",
          dossierTargetState: "dossier_review_draft",
          persistenceState: "persisted_dossier_runtime_record",
          reviewState: "review_required",
          publishState: "not_published",
          graphTargetState: "planned_not_active",
          auditRef: "audit-1",
          missingRuntimeTruth: [],
        },
      },
    });

    const dossierItems = model.claimToDossierPipeline.items.filter(
      (item) => item.candidateType !== "poll",
    );

    expect(model.claimToDossierPipeline.reviewRecordTruth).toBe("persisted_review_record");
    expect(model.claimToDossierPipeline.reviewRecordId).toBe("persisted-create-handoff-1");
    expect(dossierItems.every((item) => item.targetState === "dossier_review_draft")).toBe(
      true,
    );
    expect(
      dossierItems.every(
        (item) => item.persistenceState === "persisted_dossier_runtime_record",
      ),
    ).toBe(true);
    expect(
      dossierItems.every(
        (item) => item.targetRecordId === "dossier-runtime:persisted-create-handoff-1",
      ),
    ).toBe(true);
    expect(model.claimToDossierPipeline.dossierRuntimeHandoff).toMatchObject({
      dossierRuntimeId: "dossier-runtime:persisted-create-handoff-1",
      dossierRuntimeState: "dossier_review_draft",
      dossierTargetState: "dossier_review_draft",
      persistenceState: "persisted_dossier_runtime_record",
      graphTargetState: "planned_not_active",
    });
    expect(dossierItems.every((item) => item.missingRuntimeTruth.length === 0)).toBe(true);
  });
});
