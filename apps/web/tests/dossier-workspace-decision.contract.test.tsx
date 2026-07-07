import { describe, expect, it } from "vitest";

import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import {
  buildDossierWorkspaceDecisionFromCreateCandidatePreview,
  buildDossierWorkspaceDecisionFromReviewContext,
  buildDossierWorkspaceDecisionFromVoxyDialog,
} from "@/features/create/dossierWorkspaceDecisionContract";
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

describe("dossier workspace decision contract", () => {
  it("builds a create-side decision preview without claiming publication", () => {
    const model = buildDossierWorkspaceDecisionFromCreateCandidatePreview(
      buildCreateCandidatePreviewReadModel({
        followup: buildFollowupFixture(),
        draftId: "65a111111111111111111122",
        sourceUrls: ["https://example.org/schulwege"],
        materialItems: [],
      }),
    );

    expect(model).not.toBeNull();
    expect(model).toMatchObject({
      surface: "create",
      workspaceStatus: "needs_human_input",
      translationIsEvidence: false,
      originalPreserved: true,
      noPublishAction: true,
      noRuntimeClaim: true,
    });
    expect(model?.claimItems.length).toBeGreaterThan(0);
    expect(model?.nextDecision.id).toBe("clarify_human_input");
  });

  it("keeps multilingual RTL account dialog separate from evidence", () => {
    const dialog = buildVoxyCocreationDialog({
      contributionRef: { id: "contribution-rtl", title: "معابر آمنة" },
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
    const model = buildDossierWorkspaceDecisionFromVoxyDialog(dialog, {
      nextStep: "Antworten und Quellen nachziehen.",
    });

    expect(model).toMatchObject({
      surface: "account",
      rtlDisplayHint: true,
      translationIsEvidence: false,
      workspaceStatus: "needs_human_input",
    });
    expect(model?.languageLabel).toContain("Original: Arabisch");
    expect(model?.languageLabel).toContain("Lesefassung: Deutsch");
    expect(model?.languageLabel).toContain("RTL-Hinweis aktiv");
  });

  it("recognizes poll candidates in review context as a review-first decision layer", () => {
    const model = buildDossierWorkspaceDecisionFromReviewContext(
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
        participationCandidates: [
          {
            id: "poll-1",
            candidateType: "poll_candidate",
            sourceRecommendation: "poll",
            title: "Poll-Frage",
            prompt: "Welche Maßnahme zuerst?",
            options: [
              { id: "opt-1", label: "Querung A", draftOnly: true },
              { id: "opt-2", label: "Querung B", draftOnly: true },
            ],
            reviewRequired: true,
            autoActivate: false,
            neutralityHint: "neutral review",
            activationState: "draft_only",
          },
        ],
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
        },
        voxyBriefing: null,
        voxyRenderJob: null,
        voxyPublishDraft: null,
      } as any,
      {
        audience: "workspace",
        contributionRef: {
          id: "review-1",
          title: "Schulsanierung im Bezirk",
          href: "/admin/review/review-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.surface).toBe("workspace");
    expect(model?.downstreamReadiness.find((entry) => entry.id === "poll")).toMatchObject({
      status: "needs_review",
    });
    expect(model?.workspaceStatus).toBe("needs_human_input");
    expect(model?.nextDecision.id).toBe("clarify_human_input");
  });
});
