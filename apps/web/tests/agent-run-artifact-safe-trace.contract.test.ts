import { describe, expect, it } from "vitest";
import {
  buildCreateAgentRunSafeTrace,
  buildRundenAgentRunSafeTrace,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

describe("agent run artifact safe trace contract", () => {
  it("maps runden no-ai and manual transition into user-safe trace steps", () => {
    const trace = buildRundenAgentRunSafeTrace({
      serverDraft: {
        draftId: "draft-1",
        updatedAt: "2026-07-13T08:00:00.000Z",
        setup: {
          title: "Sichere Schulwege",
          votingQuestion: "Welche Massnahme zuerst?",
          description: "Gefaehrliche Querungen vor der Schule.",
          scope: "public",
          visibility: "private_draft",
          options: ["Zebrastreifen", "Tempo 30"],
          communityOptionsMode: "disabled",
          aiSupportMode: "disabled",
          nextStep: "continue_create",
        },
      },
    });

    expect(trace[0]).toMatchObject({
      roleId: "governance_compliance",
      status: "completed",
      requiredHumanAction: "none",
    });
    expect(trace[1]).toMatchObject({
      status: "review_required",
      requiredHumanAction: "continue_manually",
    });
    expect(JSON.stringify(trace)).not.toContain("gpt-4.1-mini");
    expect(trace[0]?.hiddenByPolicy.join(" ")).toContain("Keine Prompts");
  });

  it("keeps create trace user-safe while preserving role, artifacts and review gates", () => {
    const trace = buildCreateAgentRunSafeTrace({
      initialText: "Mehr sichere Schulwege rund um die Grundschule.",
      draftId: "draft-123",
      dossierId: "dossier-123",
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
        draftId: "draft-123",
        reason: "manual_anlassraum_continue_create",
      },
      plannerTrace: {
        requestId: "request-1",
        operationId: "request-1",
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
        generatedAt: "2026-07-13T08:00:00.000Z",
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
            plannerClusters: ["Mobilitaet"],
            plannerOpenQuestions: ["Welche Kreuzung zuerst?"],
            shortSummary: "Kurzfassung",
            topicCandidates: ["Sichere Schulwege"],
            clusterCandidates: ["Mobilitaet"],
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
          createdAt: "2026-07-13T08:00:00.000Z",
        },
        providerMatrix: [{ provider: "openai", state: "ok", model: "gpt-4.1-mini" }],
        runReceipt: {
          id: "receipt-123",
          createdAt: "2026-07-13T08:00:00.000Z",
          pipelineVersion: "v1",
          provider: "openai",
          model: "gpt-4.1-mini",
          inputHash: "in",
          sourcesHash: "sources",
          outputHash: "out",
          receiptHash: "receipt",
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

    expect(trace.find((step) => step.stepId === "create_planner_trace")).toMatchObject({
      roleId: "intake_format",
      status: "review_required",
      requiredHumanAction: "confirm_intake_split",
    });
    expect(trace.find((step) => step.stepId === "feed_enrichment_review_suggestions")).toMatchObject({
      roleId: "research_source",
      requiredHumanAction: "verify_source_provenance",
    });
    expect(trace.every((step) => step.traceScopeLine.includes("Arbeitsschritte"))).toBe(true);
    expect(JSON.stringify(trace)).not.toContain("provider");
    expect(JSON.stringify(trace)).not.toContain("model");
  });
});
