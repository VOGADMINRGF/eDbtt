import { describe, expect, it } from "vitest";
import {
  buildAdminOrchestratorAiProvenanceTraceStep,
  buildCreateAiOrchestrationProvenanceTrace,
  buildRundenAiOrchestrationProvenanceTrace,
} from "@/features/create/aiOrchestrationProvenanceTrace";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import type { CreatePlannerValidatedProviderSource } from "@/features/create/createPlannerProviderContract";

function buildPlannerTraceResult(input: {
  provider: CreatePlannerValidatedProviderSource;
  model: string;
  attempt: number;
  finalFailure?: boolean;
}): CreateIntelligentFollowupResult {
  const finalFailure = input.finalFailure === true;
  return {
    understanding: {
      summary: finalFailure
        ? "Es liegt noch kein validierter KI-Run vor."
        : "Sichere Schulwege sollen verbessert werden.",
      categories: [],
      topics: finalFailure
        ? []
        : [{ id: "topic-1", label: "Sichere Schulwege", confidence: "high" }],
      statements: [],
      scopes: finalFailure ? ["unclear"] : ["district"],
      confidence: finalFailure ? "low" : "high",
    },
    suggestions: [],
    sourceText: "Vor der Schule fehlen sichere Querungen.",
    generatedAt: "2026-07-30T10:00:00.000Z",
    degraded: finalFailure,
    degradedReason: finalFailure ? "provider_error" : null,
    meta: {
      planner: {
        source: finalFailure ? "technical_fallback" : input.provider,
        plannerSource: finalFailure ? "technical_fallback" : input.provider,
        plannerProvider: finalFailure ? "local_fallback" : input.provider,
        plannerRole: "planner_only",
        plannerTopic: finalFailure
          ? "Analyse noch nicht validiert"
          : "Sichere Schulwege",
        plannerCore: finalFailure
          ? "Es liegt noch kein validierter KI-Run vor."
          : "Vor der Schule fehlen sichere Querungen.",
        plannerScope: finalFailure ? ["unclear"] : ["district"],
        plannerStance: finalFailure ? "unclear" : "pro",
        plannerClusters: finalFailure ? [] : ["Schulwegsicherheit"],
        plannerOpenQuestions: [],
        shortSummary: finalFailure
          ? "Es liegt noch kein validierter KI-Run vor."
          : "Sichere Schulwege sollen verbessert werden.",
        topicCandidates: finalFailure ? [] : ["Sichere Schulwege"],
        clusterCandidates: finalFailure ? [] : ["Schulwegsicherheit"],
        scopeCandidates: finalFailure ? ["unclear"] : ["district"],
        stance: finalFailure ? "unclear" : "pro",
        openQuestions: [],
        graphSearchTerms: finalFailure ? [] : ["Schulwege"],
        materialSignals: [],
        recommendedLane: finalFailure ? "standard" : "create_fast_followup",
        providerPlan: {
          lane: finalFailure ? "standard" : "create_fast_followup",
          plannerProvider: finalFailure ? "local_fallback" : input.provider,
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
        plannerDegraded: finalFailure,
        degradedReason: finalFailure ? "provider_error" : null,
        plannerDegradedReason: finalFailure ? "provider_error" : null,
        qualityStatus: finalFailure ? "failed" : "specific",
        qualityIssues: finalFailure ? ["technical_fallback_only"] : [],
        providerCallAttempted: true,
        providerCallSucceeded: !finalFailure,
        providerAttemptCount: input.attempt,
        plannerDebug: {
          attemptedProvider: input.provider,
          usedProvider: finalFailure ? "local_fallback" : input.provider,
          attemptedModel: input.model,
          usedModel: finalFailure ? null : input.model,
          providerAvailable: true,
          providerErrorCode: finalFailure ? "upstream_error" : null,
          providerErrorMessage: finalFailure ? "sanitized provider failure" : null,
          errorMessage: finalFailure ? "sanitized provider failure" : null,
          rawPayloadValid: !finalFailure,
          rawTextValid: !finalFailure,
          normalizedPayloadValid: !finalFailure,
          qualityGatePassed: !finalFailure,
        },
      },
      analysis: {
        state: finalFailure ? "ai_failed" : "result_ready",
        sourceType: "text",
        sourceUrl: null,
        sourceLoaded: true,
        validationStatus: finalFailure ? "failed" : "validated",
        userMessage: finalFailure ? "Die Analyse konnte nicht abgeschlossen werden." : null,
      },
      graphMatch: {
        stage: "after_structure",
        prepared: !finalFailure,
        requiresConfirmation: true,
        searchTerms: finalFailure ? [] : ["Schulwege"],
        matches: [],
        matchedTopics: [],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: [],
        matchedVotes: [],
        shouldCreateNewTopic: !finalFailure,
      },
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
}

describe("AI orchestration provenance trace contract", () => {
  it("keeps /runden/new no-ai and draft-first without inventing usage", () => {
    const steps = buildRundenAiOrchestrationProvenanceTrace({
      serverDraft: {
        draftId: "65a111111111111111111122",
        updatedAt: "2026-07-03T13:00:00.000Z",
        setup: {
          title: "Sichere Schulwege",
          votingQuestion: "Welche Maßnahme zuerst?",
          description: "Gefährliche Querungen vor der Schule.",
          scope: "public",
          visibility: "private_draft",
          options: ["Zebrastreifen", "Tempo 30"],
          communityOptionsMode: "disabled",
          aiSupportMode: "disabled",
          nextStep: "continue_create",
        },
      },
    });

    expect(steps[0]).toMatchObject({
      stepId: "runden_no_ai_draft",
      aiActive: false,
      usageRecorded: false,
      providerKnown: false,
      inputOriginType: "server_draft",
      graphTarget: "draft_pre_record",
      reviewState: "draft",
      publishState: "not_published",
    });
    expect(steps[1]).toMatchObject({
      stepId: "runden_create_transition",
      graphTargetState: "planned_handoff",
      missingRuntimeTruth: true,
    });
  });

  it("maps planner, analyze and planned downstream steps with honest runtime truth", () => {
    const steps = buildCreateAiOrchestrationProvenanceTrace({
      initialText: "Mehr sichere Schulwege rund um die Grundschule.",
      draftId: "65a111111111111111111122",
      dossierId: "dossier-123",
      anlassraumId: "anlass-456",
      intakeContext: {
        source: "runden",
        signalTitle: "Sichere Schulwege",
        sourceUrl: null,
        sourceLabel: "Anlassraum-Entwurf aus /runden/new",
        region: null,
        scope: null,
        clusterHint: null,
        reviewState: null,
        candidateId: null,
        draftId: "65a111111111111111111122",
        reason: "manual_anlassraum_continue_create",
      },
      plannerTrace: {
        requestId: "request-123",
        operationId: "request-123",
        operationType: "create_intelligent_followup_planner",
        userScope: "present",
      },
      plannerResult: {
        understanding: {
          summary: "Kurzfassung",
          categories: [],
          topics: [],
          statements: [],
          scopes: ["district"],
          confidence: "medium",
        },
        suggestions: [],
        sourceText: "Mehr sichere Schulwege rund um die Grundschule.",
        generatedAt: "2026-07-03T13:00:00.000Z",
        meta: {
          planner: {
            source: "openai",
            plannerSource: "openai",
            plannerProvider: "openai",
            plannerRole: "planner_only",
            plannerTopic: "Sichere Schulwege",
            plannerCore: "Mehr sichere Schulwege rund um die Grundschule.",
            plannerScope: ["district"],
            plannerStance: "pro",
            plannerClusters: ["Mobilität"],
            plannerOpenQuestions: ["Welche Kreuzung zuerst?"],
            shortSummary: "Kurzfassung",
            topicCandidates: ["Sichere Schulwege"],
            clusterCandidates: ["Mobilität"],
            scopeCandidates: ["district"],
            stance: "pro",
            openQuestions: ["Welche Kreuzung zuerst?"],
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
            providerAttemptCount: 1,
            plannerDebug: {
              attemptedProvider: "openai",
              usedProvider: "openai",
              attemptedModel: "gpt-4.1-mini",
              usedModel: "gpt-4.1-mini",
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
            shouldCreateNewTopic: false,
          },
          researchUsed: "none",
          researchProvider: null,
          deepSearchUsed: false,
        },
      },
      analyzeTrace: {
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
          claims: [],
          questions: [],
          missingPerspectives: [],
          participationCandidates: [],
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
          confidence: 0.6,
          uncertaintyFlags: [],
          requiresHumanReview: true,
          reviewRecommended: true,
          noAutoPublish: true,
          noSilentMerge: true,
          provenanceRefs: ["run-123"],
          createdAt: "2026-07-03T13:00:00.000Z",
        },
        providerMatrix: [{ provider: "openai", state: "ok", model: "gpt-4.1-mini" }],
        runReceipt: {
          id: "receipt-123",
          createdAt: "2026-07-03T13:00:00.000Z",
          pipelineVersion: "v1",
          provider: "openai",
          model: "gpt-4.1-mini",
          inputHash: "in",
          sourcesHash: "sources",
          outputHash: "out",
          receiptHash: "receiptHash",
          snapshotId: "snapshot-123",
          sourceSet: [
            {
              canonicalUrl: "https://example.org/schulwege",
              sourceType: "media",
              title: "Schulwege im Bezirk",
            },
          ],
          contentPolicy: {
            maxSnippetChars: 240,
            storeFullText: false,
            storeSnippets: false,
            storeTitles: true,
          },
        },
      },
      candidateReviewHandoffAvailable: true,
      claimToDossierPipelineAvailable: true,
      feedEnrichmentSuggestionsAvailable: true,
    });

    expect(steps.find((step) => step.stepId === "create_planner_trace")).toMatchObject({
      provider: "openai",
      model: "gpt-4.1-mini",
      providerKnown: true,
      aiActive: true,
      usageRecorded: true,
      graphTarget: "graph_candidate",
      graphTargetState: "candidate_only",
      reviewState: "review_required",
    });
    expect(steps.find((step) => step.stepId === "create_analyze_trace")).toMatchObject({
      provider: "openai",
      model: "gpt-4.1-mini",
      aiActive: true,
      usageRecorded: true,
      evidenceRefs: expect.arrayContaining(["run-123", "receipt-123", "snapshot-123"]),
      graphTarget: "graph_candidate",
      publishState: "publish_blocked",
    });
    expect(steps.find((step) => step.stepId === "claims_questions_review_handoff")).toMatchObject({
      outputType: "candidate_review_handoff",
      graphTarget: "review_queue_handoff",
      missingRuntimeTruth: false,
      userVisibleLabel:
        "Claims, Gegenpositionen und Fragen sind als Dossier-/Graph-/Anlassraum-Handoff vorbereitet; Umfragen bleiben geplant",
      adminVisibleLabel: "Claims / Questions / Dossier / Graph / Anlassraum review handoff",
    });
    expect(steps.find((step) => step.stepId === "feed_enrichment_review_suggestions")).toMatchObject({
      outputType: "candidate_preview",
      graphTarget: "review_queue_handoff",
      graphTargetState: "planned_handoff",
      userVisibleLabel:
        "Vorhandene Feed-, Quellen- und Materialhinweise bleiben review-first Vorschläge",
      adminVisibleLabel: "Feed / source / material enrichment suggestions",
    });
    expect(steps.find((step) => step.stepId === "feeds_social_voxy_planned")).toMatchObject({
      outputType: "planned_not_active",
      missingRuntimeTruth: true,
    });
  });

  it.each([
    {
      provider: "openai" as const,
      model: "gpt-4.1-mini",
      attempt: 1,
    },
    {
      provider: "anthropic" as const,
      model: "claude-sonnet-test",
      attempt: 2,
    },
    {
      provider: "mistral" as const,
      model: "mistral-large-test",
      attempt: 2,
    },
  ])(
    "records the actual $provider model and provider attempt in planner and candidate traces",
    ({ provider, model, attempt }) => {
      const steps = buildCreateAiOrchestrationProvenanceTrace({
        initialText: "Vor der Schule fehlen sichere Querungen.",
        plannerResult: buildPlannerTraceResult({
          provider,
          model,
          attempt,
        }),
        plannerTrace: {
          requestId: `request-${provider}`,
          operationId: `request-${provider}`,
          operationType: "create_intelligent_followup_planner",
          userScope: "present",
        },
      });
      const plannerStep = steps.find(
        (step) => step.stepId === "create_planner_trace",
      );
      const candidateStep = steps.find(
        (step) => step.stepId === "claims_questions_review_handoff",
      );

      expect(plannerStep).toMatchObject({
        provider,
        model,
        providerAttempt: attempt,
        providerResultStatus: "succeeded",
      });
      expect(candidateStep).toMatchObject({
        provider,
        model,
        providerAttempt: attempt,
        providerResultStatus: "succeeded",
      });
      const serialized = JSON.stringify(candidateStep);
      expect(serialized).not.toMatch(/prompt|completion|api[_-]?key|secret/i);
    },
  );

  it("keeps the actual second provider and final degraded status visible after failure", () => {
    const steps = buildCreateAiOrchestrationProvenanceTrace({
      initialText: "Vor der Schule fehlen sichere Querungen.",
      plannerResult: buildPlannerTraceResult({
        provider: "anthropic",
        model: "claude-sonnet-test",
        attempt: 2,
        finalFailure: true,
      }),
      plannerTrace: {
        requestId: "request-final-failure",
        operationId: "request-final-failure",
        operationType: "create_intelligent_followup_planner",
        userScope: "present",
      },
    });
    const candidateStep = steps.find(
      (step) => step.stepId === "claims_questions_review_handoff",
    );

    expect(candidateStep).toMatchObject({
      provider: "anthropic",
      model: "claude-sonnet-test",
      providerAttempt: 2,
      providerResultStatus: "degraded_fallback",
      providerKnown: true,
    });
    expect(JSON.stringify(candidateStep)).not.toContain(
      "sanitized provider failure",
    );
  });

  it("keeps admin smoke provider truth technical and admin-only", () => {
    const step = buildAdminOrchestratorAiProvenanceTraceStep({
      runId: "run-admin-1",
      correlationId: "corr-admin-1",
      provider: "openai",
      model: "gpt-4.1-mini",
    });

    expect(step).toMatchObject({
      surface: "/admin/telemetry/ai/orchestrator",
      providerVisibility: "admin_review_only",
      aiActive: true,
      usageRecorded: true,
      outputType: "admin_smoke_diagnostics",
    });
  });
});
