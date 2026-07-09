import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import CreateCandidatePreviewPanel from "@/features/create/CreateCandidatePreviewPanel";
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

describe("create candidate preview contract", () => {
  it("builds a preview-only candidate model with honest runtime truth and no persistence claim", () => {
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
      runReceipt: {
        id: "receipt-123",
        createdAt: "2026-07-03T14:00:00.000Z",
        pipelineVersion: "v1",
        provider: "openai",
        model: "gpt-4.1-mini",
        inputHash: "in",
        sourcesHash: "sources",
        outputHash: "out",
        receiptHash: "receipt",
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
      draftId: "65a111111111111111111122",
      sourceUrls: ["https://example.org/schulwege"],
      materialItems: [],
    });

    expect(model.hasPreview).toBe(true);
    expect(model.persistence).toBe("preview_only");
    expect(model.carriesPersistentWrite).toBe(false);
    expect(model.provider).toBe("openai");
    expect(model.model).toBe("gpt-4.1-mini");
    expect(model.voxyCocreationDialog).toMatchObject({
      title: "Mit Voxy weiterdenken",
      status: "needs_user_input",
      sourceLanguage: "de",
      readingLanguage: "de",
      originalPreserved: true,
      noManipulation: true,
      reviewRequired: true,
      autoPublish: false,
    });
    expect(model.voxyCocreationDialog?.cards.length).toBeGreaterThan(1);
    expect(model.voxyCocreationDialog?.cards[0]?.userVisibleQuestion).toContain("Welche Kreuzung zuerst?");
    expect(model.reviewHandoff).toMatchObject({
      hasPreparedHandoff: true,
      targetCarrier: "create_handoff_review_queue",
      targetState: "review_draft",
      persistenceTruth: "missing_persistence_truth",
      carriesPersistentWrite: false,
    });
    expect(model.claimToDossierPipeline).toMatchObject({
      hasPreparedPipeline: true,
      carriesPersistentWrite: false,
      reviewRecordTruth: "missing_persistence_truth",
      reviewRecordId: null,
      dossierRuntimeTruth: "persistent_runtime_available",
      participationRuntimeTruth: "persistent_runtime_available",
    });
    expect(model.claimToDossierPipeline.dossierDraftPreview).not.toBeNull();
    expect(model.claimToDossierPipeline.dossierRuntimeHandoff).toMatchObject({
      dossierRuntimeId: null,
      dossierRuntimeState: "dossier_handoff_prepared",
      dossierTargetState: "dossier_handoff_prepared",
      persistenceState: "missing_dossier_runtime_truth",
      publishState: "no_auto_publish",
      graphTargetState: "planned_not_active",
    });
    expect(model.claimToDossierPipeline.dossierGraphAnlassraumHandoff).toMatchObject({
      sourceDossierRuntimeId: null,
      targetGraphId: null,
      targetAnlassraumId: null,
      targetParticipationSpaceId: null,
      graphTargetState: "missing_graph_runtime_truth",
      branchWorkspaceTargetState: "branch_workspace_candidate",
      anlassraumTargetState: "missing_anlassraum_runtime_truth",
      participationTargetState: "participation_candidate",
    });
    expect(model.claimToDossierPipeline.items.find((item) => item.candidateType === "claim")).toMatchObject({
      targetCarrier: "dossier_runtime_record",
      targetState: "dossier_handoff_prepared",
      persistenceState: "missing_persistence_truth",
    });
    expect(model.claimToDossierPipeline.items.find((item) => item.candidateType === "poll")).toMatchObject({
      targetCarrier: "participation_space_runtime_record",
      targetState: "planned_handoff",
      persistenceState: "missing_persistence_truth",
    });
    expect(model.feedEnrichmentSuggestions).toMatchObject({
      hasSuggestions: true,
      carriesPersistentWrite: false,
      enrichedCandidateTypes: ["claim", "counter_position", "question"],
      plannedCandidateTypes: ["poll"],
    });
    expect(
      model.feedEnrichmentSuggestions.items.find((item) => item.sourceType === "evidence_candidate"),
    ).toMatchObject({
      reviewState: "review_required",
      publishState: "not_published",
      deepsearchState: "planned_handoff",
    });
    expect(model.reviewHandoff.items[0]).toMatchObject({
      targetCarrier: "create_handoff_review_queue",
      targetState: "review_draft",
    });
    expect(model.sections.find((section) => section.kind === "claim")?.items[0]).toMatchObject({
      inputOrigin: "server_draft",
      sourceProvenance: "runtime_source_reference",
      derivedBy: "planner_plus_analyze",
      graphTarget: "dossier_candidate",
      graphTargetState: "candidate_only",
      publishState: "not_published",
    });
    expect(model.sections.find((section) => section.kind === "counter_position")?.items.length).toBeGreaterThan(0);
    expect(model.sections.find((section) => section.kind === "poll")?.items.length).toBeGreaterThan(0);
  });

  it("reflects an existing persisted dossier review record without inventing a target runtime record", () => {
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

    const dossierItem = model.claimToDossierPipeline.items.find((item) => item.candidateType === "claim");
    const pollItem = model.claimToDossierPipeline.items.find((item) => item.candidateType === "poll");

    expect(model.claimToDossierPipeline).toMatchObject({
      handoffId: "persisted-create-handoff-1",
      reviewRecordId: "persisted-create-handoff-1",
      reviewRecordTruth: "persisted_review_record",
      carriesPersistentWrite: false,
    });
    expect(dossierItem).toMatchObject({
      targetCarrier: "dossier_runtime_record",
      targetState: "dossier_review_draft",
      targetRecordId: "dossier-runtime:persisted-create-handoff-1",
      persistenceState: "persisted_dossier_runtime_record",
    });
    expect(model.claimToDossierPipeline.dossierRuntimeHandoff).toMatchObject({
      dossierRuntimeId: "dossier-runtime:persisted-create-handoff-1",
      dossierRuntimeState: "dossier_review_draft",
      persistenceState: "persisted_dossier_runtime_record",
    });
    expect(model.claimToDossierPipeline.dossierGraphAnlassraumHandoff).toMatchObject({
      sourceDossierRuntimeId: "dossier-runtime:persisted-create-handoff-1",
      targetGraphId: null,
      targetAnlassraumId: null,
      targetParticipationSpaceId: null,
      graphTargetState: "planned_handoff",
      branchWorkspaceTargetState: "branch_workspace_candidate",
      anlassraumTargetState: "planned_handoff",
      participationTargetState: "participation_candidate",
    });
    expect(dossierItem?.missingRuntimeTruth).toEqual([]);
    expect(dossierItem?.missingRuntimeTruth).not.toContain("candidate_handoff_not_persisted");
    expect(pollItem).toMatchObject({
      targetCarrier: "participation_space_runtime_record",
      targetState: "planned_handoff",
      persistenceState: "missing_persistence_truth",
    });
  });

  it("renders the preview panel as a review-first, preview-only surface", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateCandidatePreviewPanel, {
        model: buildCreateCandidatePreviewReadModel({
          followup: buildFollowupFixture(),
          draftId: "65a111111111111111111122",
          sourceUrls: [],
          materialItems: [],
        }),
      }),
    );

    expect(html).toContain("Review-first Kandidaten aus Draft, Planner und Analyze");
    expect(html).toContain("Nur Vorschau");
    expect(html).toContain("V3-Arbeitsfluss ab hier");
    expect(html).toContain("Create / Handoff");
    expect(html).toContain("Anlassraum / Beteiligung");
    expect(html).toContain('data-testid="create-candidate-workflow-surface"');
    expect(html).toContain('data-testid="create-candidate-downstream-ki-transparency"');
    expect(html).toContain('data-testid="create-candidate-voxy-cocreation"');
    expect(html).toContain('data-testid="create-candidate-source-factcheck-feed-enrichment"');
    expect(html).toContain('data-testid="create-candidate-dossier-workspace-decision"');
    expect(html).toContain('data-testid="create-candidate-participation-activation-review"');
    expect(html).toContain('data-testid="create-candidate-poll-question-options-review"');
    expect(html).toContain('data-testid="create-candidate-output-social-workbench"');
    expect(html).toContain('data-testid="create-candidate-voxy-briefing-script"');
    expect(html).toContain('data-testid="create-candidate-voxy-render-decision"');
    expect(html).toContain('data-testid="create-candidate-voxy-render-provider-handoff"');
    expect(html).toContain('data-testid="create-candidate-voxy-render-preflight"');
    expect(html).toContain('data-testid="create-candidate-voxy-render-registry"');
    expect(html).toContain('data-testid="create-candidate-voxy-render-adapter"');
    expect(html).toContain("Mit Voxy weiterdenken");
    expect(html).toContain("Quellen &amp; Faktencheck vorbereiten");
    expect(html).toContain("Dossier-Entscheidungslogik");
    expect(html).toContain("Beteiligungsraum vorbereiten");
    expect(html).toContain("Poll/Frage vorbereiten");
    expect(html).toContain("Ausgabe vorbereiten");
    expect(html).toContain("Voxy-Briefing vorbereiten");
    expect(html).toContain("Render-Entscheidung");
    expect(html).toContain("Voxy-Render/Provider-Handoff vorbereiten");
    expect(html).toContain("Voxy-Render-Preflight vorbereiten");
    expect(html).toContain("Voxy Asset- &amp; Provider-Registry");
    expect(html).toContain("Render-Adapter vorbereiten");
    expect(html).toContain("Vorgeschlagenes Beteiligungsformat");
    expect(html).toContain("Vorschlag, nicht aktiviert");
    expect(html).toContain("Vorschlag, kein Poll");
    expect(html).toContain("Vorschlag, nicht veröffentlicht");
    expect(html).toContain("Script-Kandidat, noch kein Video");
    expect(html).toContain("Handoff-Paket");
    expect(html).toContain("Render-Preflight");
    expect(html).toContain("Asset- &amp; Provider-Registry");
    expect(html).toContain("Noop-Ergebnis");
    expect(html).toContain("Warum noch nicht gerendert wird");
    expect(html).toContain("Frage-Typ");
    expect(html).toContain("Mögliche Ausgabeformate");
    expect(html).toContain("Übersetzung bleibt getrennte Lesefassung und ist kein Beleg.");
    expect(html).toContain("Nächste Entscheidung");
    expect(html).toContain("Noch nicht recherchiert · noch nicht geprüft · keine Quelle erfunden");
    expect(html).toContain("Antworten verbessern den Beitrag, veröffentlichen aber nichts.");
    expect(html).toContain("Welches konkrete Beispiel würde deinen Beitrag stärker und prüfbarer machen?");
    expect(html).toContain("KI-, Review- und Enrichment-Transparenz");
    expect(html).toContain("Quellen- und Evidence-Pack");
    expect(html).toContain("Claim-Kandidaten");
    expect(html).toContain("Gegenpositions-Kandidaten");
    expect(html).toContain("Fragen-Kandidaten");
    expect(html).toContain("Umfrage-Kandidaten");
    expect(html).toContain("Keine externe Quelle behauptet");
    expect(html).toContain("Review erforderlich");
    expect(html).toContain("Review-Handoff vorbereiten");
    expect(html).toContain("missing_persistence_truth");
    expect(html).toContain("create_handoff_review_queue");
    expect(html).toContain("Claim-to-Dossier-Pipeline vorbereiten");
    expect(html).toContain("Review-Record");
    expect(html).toContain("Graph- / Anlassraum-Handoff");
    expect(html).toContain("target_graph_id");
    expect(html).toContain("Feed-, Quellen- und Materialhinweise vorbereiten");
    expect(html).toContain("no_auto_deepsearch");
    expect(html).toContain("Dossier-Draft-Vorschau");
    expect(html).toContain("dossier_handoff_prepared");
    expect(html).toContain("planned_handoff");
    expect(html).not.toContain("automatisch veröffentlicht");
    expect(html).not.toContain("blocked_by_provider");
  });
});
