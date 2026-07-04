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
    generatedAt: "2026-07-04T09:00:00.000Z",
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

describe("create feed enrichment review suggestions contract", () => {
  it("attaches existing source, material and evidence hints review-first to non-poll candidates", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupFixture(),
      draftId: "65a111111111111111111122",
      intakeContext: {
        source: "context_picker_feed",
        signalTitle: "Schulwege im Bezirk",
        sourceUrl: "https://beispiel.invalid/feed/schulwege",
        sourceLabel: "Feed Radar Schulwege",
        region: "beispielstadt",
        scope: "district",
        clusterHint: "Mobilität",
        reviewState: "queued",
        candidateId: "candidate-1",
        draftId: "65a111111111111111111122",
        reason: "feed_context",
      },
      sourceUrls: ["https://example.org/schulwege"],
      materialItems: [
        {
          id: "mat-1",
          kind: "pdf_document",
          label: "Verkehrsbericht",
          url: "https://example.org/verkehrsbericht.pdf",
          uploadId: null,
          mimeType: "application/pdf",
          fileName: "verkehrsbericht.pdf",
          text: "Auszug aus dem Verkehrsbericht.",
          pageRef: "S. 4",
          timestampRef: null,
          extractedBy: "manual",
          extractionStatus: "partial",
        },
      ],
      runReceipt: {
        id: "receipt-123",
        createdAt: "2026-07-04T09:00:00.000Z",
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
    });

    expect(model.feedEnrichmentSuggestions.hasSuggestions).toBe(true);
    expect(model.feedEnrichmentSuggestions.enrichedCandidateTypes).toEqual([
      "claim",
      "counter_position",
      "question",
    ]);
    expect(model.feedEnrichmentSuggestions.plannedCandidateTypes).toEqual(["poll"]);
    expect(
      model.feedEnrichmentSuggestions.items.some(
        (item) =>
          item.candidateType === "claim" && item.sourceType === "feed_candidate",
      ),
    ).toBe(true);
    expect(
      model.feedEnrichmentSuggestions.items.some(
        (item) =>
          item.candidateType === "claim" && item.sourceType === "material_candidate",
      ),
    ).toBe(true);
    expect(
      model.feedEnrichmentSuggestions.items.some(
        (item) => item.sourceType === "evidence_candidate",
      ),
    ).toBe(true);
    expect(
      model.feedEnrichmentSuggestions.items.every(
        (item) => item.deepsearchState === "planned_handoff",
      ),
    ).toBe(true);
    expect(
      model.feedEnrichmentSuggestions.items.every(
        (item) => item.publishState === "not_published",
      ),
    ).toBe(true);
  });

  it("keeps the slice honest as missing_source_truth when no real hint is present", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupFixture(),
      draftId: "65a111111111111111111122",
      sourceUrls: [],
      materialItems: [],
    });

    expect(model.feedEnrichmentSuggestions.hasSuggestions).toBe(true);
    expect(
      model.feedEnrichmentSuggestions.items.every(
        (item) => item.sourceType === "missing_source_truth",
      ),
    ).toBe(true);
    expect(
      model.feedEnrichmentSuggestions.items.every((item) =>
        item.missingRuntimeTruth.includes("no_existing_feed_source_material_truth"),
      ),
    ).toBe(true);
  });
});
