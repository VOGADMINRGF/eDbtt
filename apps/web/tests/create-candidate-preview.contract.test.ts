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
    expect(html).toContain("Claim-Kandidaten");
    expect(html).toContain("Gegenpositions-Kandidaten");
    expect(html).toContain("Fragen-Kandidaten");
    expect(html).toContain("Umfrage-Kandidaten");
    expect(html).toContain("Keine externe Quelle behauptet");
    expect(html).toContain("Review erforderlich");
    expect(html).not.toContain("automatisch veröffentlicht");
  });
});
