import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import SourceFactcheckFeedEnrichmentPanel from "@/features/create/SourceFactcheckFeedEnrichmentPanel";
import {
  buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview,
  buildSourceFactcheckFeedEnrichmentFromReviewContext,
  buildSourceFactcheckFeedEnrichmentFromVoxyDialog,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import { buildVoxyCocreationDialog } from "@/features/create/voxyCocreationDialogContract";

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
      ],
      scopes: ["district" as const],
      openQuestion: "Welche Kreuzung zuerst?",
      confidence: "medium" as const,
    },
    suggestions: [],
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

describe("source factcheck feed enrichment contract", () => {
  it("builds a review-first create enrichment model without inventing sources", () => {
    const model = buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview(
      buildCreateCandidatePreviewReadModel({
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
      }),
    );

    expect(model).not.toBeNull();
    expect(model).toMatchObject({
      title: "Quellen & Faktencheck vorbereiten",
      sourceLanguage: "de",
      readingLanguage: "de",
      originalPreserved: true,
      translationIsEvidence: false,
      noSourceInvented: true,
      noFactcheckResult: true,
      noProviderRun: true,
    });
    expect(model?.sourceNeeds.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["primary_source", "media_reference"]),
    );
    expect(model?.claimReviewNeeds.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["normative_claim", "unclear_claim"]),
    );
    expect(model?.referenceScopes.map((entry) => entry.id)).toContain("local");
    expect(model?.factcheckQuestions.length).toBeGreaterThan(0);
    expect(model?.feedHints.length).toBeGreaterThan(0);
  });

  it("keeps Turkish originals and German reading mode separate", () => {
    const dialog = buildVoxyCocreationDialog({
      contributionRef: { id: "contribution-1", title: "Okul yolu güvenliği" },
      sourceLanguage: "tr",
      readingLanguage: "de",
      uiLocale: "de",
      originalText: "Okul yolunda çocuklar için güvenli geçiş istiyoruz.",
      translationText: "Wir wollen sichere Querungen für Kinder auf dem Schulweg.",
      sourcePresent: false,
      uncertaintyNotes: ["source_needed"],
      claimCount: 1,
      surface: "create",
    });
    const model = buildSourceFactcheckFeedEnrichmentFromVoxyDialog(dialog, {
      surface: "account",
    });

    expect(model).toMatchObject({
      sourceLanguage: "tr",
      readingLanguage: "de",
      translationAvailable: true,
      translationIsEvidence: false,
    });
    expect(model?.referenceScopes.map((entry) => entry.id)).toContain("multilingual");
  });

  it("marks Arabic originals as RTL-safe without translating them into evidence", () => {
    const dialog = buildVoxyCocreationDialog({
      contributionRef: { id: "contribution-2", title: "معابر آمنة" },
      sourceLanguage: "ar",
      readingLanguage: "de",
      uiLocale: "de",
      originalText: "نحتاج إلى معابر آمنة للأطفال قرب المدرسة.",
      translationText: "Wir brauchen sichere Querungen für Kinder nahe der Schule.",
      sourcePresent: false,
      uncertaintyNotes: ["translation_uncertain", "source_needed"],
      claimCount: 1,
      surface: "create",
    });
    const model = buildSourceFactcheckFeedEnrichmentFromVoxyDialog(dialog, {
      surface: "account",
    });

    expect(model?.rtlDisplayHint).toBe(true);
    expect(model?.translationIsEvidence).toBe(false);
  });

  it("keeps French originals and English reading mode multilingual", () => {
    const dialog = buildVoxyCocreationDialog({
      contributionRef: { id: "contribution-3", title: "Logement abordable" },
      sourceLanguage: "fr",
      readingLanguage: "en",
      uiLocale: "en",
      originalText: "Il faut des loyers abordables pour les familles.",
      translationText: "Affordable rents are needed for families.",
      sourcePresent: false,
      uncertaintyNotes: ["source_needed"],
      claimCount: 1,
      surface: "create",
    });
    const model = buildSourceFactcheckFeedEnrichmentFromVoxyDialog(dialog, {
      surface: "account",
    });

    expect(model?.sourceLanguage).toBe("fr");
    expect(model?.readingLanguage).toBe("en");
    expect(model?.referenceScopes.map((entry) => entry.id)).toContain("multilingual");
  });

  it("humanizes provider blockers on review-context surfaces", () => {
    const model = buildSourceFactcheckFeedEnrichmentFromReviewContext(
      {
        primaryUnifiedItem: {
          id: "review-1",
          source: "create_handoff",
          sourceId: "draft-1",
          title: "Schulsanierung im Bezirk",
          summary: "Create-Handoff mit Review- und Quellenbedarf.",
          queueState: "in_review",
          requiredReviewType: "source_review",
          requiredReviewerRoles: ["editor"],
          lifecycleStatus: "review_queue",
          preparationStatus: "review_ready",
          reviewReadyIsApproved: false,
          publishReadyIsPublished: false,
          reviewRequired: true,
          autoPublish: false,
          publishGuard: "review_required",
          sourcePackId: "source-pack-1",
          sourcePackEvidenceState: "partial",
          trustState: "translation_uncertain",
          languageSummary: {
            originalLanguage: "fr",
            readingLanguage: "de",
          },
          nextAllowedActions: ["review"],
          reviewWorld: "existing_review_queue",
        },
        unifiedItems: [],
        sourcePack: {
          sourcePackId: "source-pack-1",
          sources: [
            {
              sourceId: "source-1",
              title: "Quelle",
              sourceLocale: "fr",
              sourceType: "media",
              reliabilityHint: "secondary",
              translationStatus: "translated",
              evidenceState: "partial",
              reviewState: "review_required",
            },
          ],
          openGaps: ["context_missing"],
          reviewState: "review_required",
          reviewRequired: true,
          autoPublish: false,
        },
        languageBridge: {
          languageContext: {
            sourceLanguage: "fr",
            contentLanguage: "de",
            uiLocale: "de",
          },
          original: {
            language: "fr",
            text: "Il faut une meilleure explication pour les familles concernées.",
            preserved: true,
          },
          translation: {
            language: "de",
            text: "Es braucht eine bessere Erklärung für betroffene Familien.",
            state: "available",
            replacesOriginal: false,
            rtl: false,
          },
          summary: {
            language: "de",
            text: "Bessere Erklärung für betroffene Familien",
            replacesOriginal: false,
            replacesSource: false,
          },
          voxyClassification: {
            language: "de",
            text: null,
            reviewRequired: true,
          },
          sourceGrounding: {
            trustState: "partially_supported",
            sourcePresent: true,
            summaryReplacesSource: false,
          },
          openQuestions: ["Welche Quelle oder Beobachtung liegt zugrunde?"],
          uncertaintyNotes: ["context_missing"],
          reviewRequired: true,
          autoPublish: false,
        },
        multilingualThread: null,
        multilingualEvidence: {
          sourcePackId: "source-pack-1",
          entries: [],
          overallTrustStatus: "translation_uncertain",
          overallUncertaintyReasons: ["translation_uncertain"],
          reviewRequired: true,
          autoPublish: false,
        },
        participationCandidates: [],
        crossLingualSuggestions: [],
        socialOutputDrafts: [],
        dossierWorkspaceSurface: {
          dossierId: "dossier-1",
          title: "Familienhilfe",
          state: "review",
          preparationStatus: "review_ready",
          publishGuard: {
            autoPublish: false,
            reviewRequired: true,
            publicOutputAllowed: false,
            publishActionEnabled: false,
            externalSocialApiTriggered: false,
          },
          guardrails: {
            noAutoPublish: true,
            noAutoDossierFinal: true,
            noAutoSocialPosting: true,
            reviewRequired: true,
          },
          sections: {
            claims: ["Familien brauchen bessere Erklärungen."],
            counterPositions: [],
            openQuestions: ["Welche Quelle oder Beobachtung liegt zugrunde?"],
            formatRecommendations: [],
            participationCandidates: [],
            socialOutputDrafts: [],
            voxyBriefingCandidates: [],
          },
          sourcePack: {
            sourcePackId: null,
            sourceCount: 1,
            reviewState: "review_required",
          },
          trustLayer: {
            trustState: "partially_supported",
            visibleAsAdvice: true,
          },
          reviewQueueItems: [],
        },
        voxyBriefing: {
          briefingId: "briefing-1",
          sourceContextKind: "dossier",
          sourceContextId: "dossier-1",
          title: "Briefing",
          summary: "Nur Kandidat",
          languageBridge: null,
          sourcePack: null,
          trustState: "source_needed",
          reviewRequired: true,
          autoPublish: false,
        } as any,
        voxyScriptSegments: [],
        voxyReviewState: null,
        voxyRenderJob: {
          briefingId: "briefing-1",
          status: "blocked_by_provider",
          provider: null,
          providerJobId: null,
          renderUrl: null,
          reviewRequired: true,
          autoPublish: false,
          missingRuntimeTruth: ["provider_missing"],
        } as any,
        voxyPublishDraft: null,
      } as any,
      {
        audience: "admin",
        contributionRef: {
          id: "review-1",
          title: "Schulsanierung im Bezirk",
        },
      },
    );

    const html = renderToStaticMarkup(
      <SourceFactcheckFeedEnrichmentPanel
        model={model}
        dataTestId="source-factcheck-feed-review"
      />,
    );

    expect(model?.enrichmentStatus).toBe("blocked_by_provider");
    expect(html).toContain("Quellen &amp; Faktencheck vorbereiten");
    expect(html).toContain("Provider blockiert");
    expect(html).not.toContain("blocked_by_provider");
  });
});
