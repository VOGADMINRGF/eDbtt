import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildV3AccountResumeWorkflowFromStartDraft,
} from "@/features/create/V3AccountResumeWorkflow";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromCreateCandidatePreview,
  buildV3DownstreamKiTransparencyFromReviewContext,
  buildV3DownstreamKiTransparencyFromStartDraft,
} from "@/features/create/V3DownstreamKiTransparency";
import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import { createStartDraftContext } from "@/features/start/startDraftContext";

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

describe("V3DownstreamKiTransparency", () => {
  it("maps create preview truth into prepared downstream steps without fake runtime", () => {
    const model = buildV3DownstreamKiTransparencyFromCreateCandidatePreview(
      buildCreateCandidatePreviewReadModel({
        followup: buildFollowupFixture(),
        draftId: "65a111111111111111111122",
        sourceUrls: ["https://example.org/schulwege"],
        materialItems: [],
      }),
    );

    const html = renderToStaticMarkup(
      <V3DownstreamKiTransparency model={model} dataTestId="downstream-create" />,
    );

    expect(html).toContain("KI-, Review- und Enrichment-Transparenz");
    expect(html).toContain("Sichere Trace-Wahrheit");
    expect(html).toContain("Quellen- und Evidence-Pack");
    expect(html).toContain("Beteiligungsformate bleiben bis zur Freigabe nur vorbereitet.");
    expect(html).toContain("Belastbare Downstream-Runtime oder Kostenfreigabe fehlt noch.");
    expect(html).toContain("nicht Debug- oder Systemdaten");
    expect(html).not.toContain("missing_runtime_truth");
    expect(html).not.toContain("planned_handoff");
  });

  it("shows review, evidence and provider blockers for admin-side review contexts", () => {
    const model = buildV3DownstreamKiTransparencyFromReviewContext(
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
            originalLanguage: "de",
            readingLanguage: "en",
          },
          nextAllowedActions: ["review"],
          reviewWorld: "existing_review_queue",
        },
        unifiedItems: [],
        sourcePack: {
          sourcePackId: "source-pack-1",
          sources: [{ evidenceState: "partial" }],
          openGaps: ["context_missing"],
        },
        languageBridge: {
          original: { language: "de" },
          translation: { language: "en", state: "review_required" },
          summary: { language: "en" },
          sourceGrounding: { trustState: "translation_uncertain" },
        },
        multilingualThread: null,
        multilingualEvidence: {
          overallTrustStatus: "translation_uncertain",
          overallUncertaintyReasons: ["translation_uncertain"],
        },
        participationCandidates: [{ title: "Beteiligungsfrage" }],
        crossLingualSuggestions: [],
        socialOutputDrafts: [{ kind: "linkedin_draft" }],
        dossierWorkspaceSurface: {
          preparationStatus: "review_ready",
          sections: {
            claims: [{ id: "claim-1" }],
            openQuestions: [{ id: "question-1" }],
          },
        },
        voxyBriefing: { title: "Voxy Schulwege" },
        voxyScriptSegments: [],
        voxyReviewState: {
          scriptReview: { status: "review_ready" },
          publishReview: { status: "approval_required" },
        },
        voxyRenderJob: { status: "blocked_by_provider" },
        voxyPublishDraft: null,
      } as any,
      "admin",
    );

    const html = renderToStaticMarkup(
      <V3DownstreamKiTransparency model={model} dataTestId="downstream-review" />,
    );

    expect(html).toContain("Quellenlage und Evidenz bleiben prüfbar und review-first.");
    expect(html).toContain("Blocker: Anbieter-Anbindung fehlt");
    expect(html).toContain("Rolle: Redaktion");
    expect(html).toContain("Voxy bleibt ein reviewpflichtiger Briefing- oder Skriptkandidat.");
    expect(html).toContain("nicht Prompts, Tokens oder Rohdiagnostik");
    expect(html).not.toContain("blocked_by_provider");
    expect(html).not.toContain("translation_uncertain");
  });

  it("keeps account-side transparency honest about missing user-scoped runtime linkage", () => {
    const draft = createStartDraftContext({
      text: "Die Schulwegsicherheit muss im Bezirk besser geklärt werden.",
      origin: "start_relevance_review",
      intent: "needs_reframe",
      targetHint: "create",
      preview: {
        relevance: "needs_reframe",
        possibleTopics: ["Schulwegsicherheit"],
        openQuestions: ["Welcher Bezirk ist gemeint?"],
        suggestedNextSteps: ["Entwurf erst nach Rückfrage weiterführen"],
      },
    });
    const workflow = buildV3AccountResumeWorkflowFromStartDraft(draft!);
    const model = buildV3DownstreamKiTransparencyFromStartDraft(draft!, workflow);
    const html = renderToStaticMarkup(
      <V3DownstreamKiTransparency model={model} dataTestId="downstream-account" />,
    );

    expect(html).toContain("Lokaler oder browsergestützter Review-Entwurf");
    expect(html).toContain("Nutzergebundene Downstream-Runtime im Account fehlt noch.");
    expect(html).toContain("Menschliche Prüfung bleibt erforderlich.");
    expect(html).toContain("nicht Debug- oder Systemdaten");
    expect(html).not.toContain("missing_runtime_truth");
    expect(html).not.toContain("blocked_by_runtime_truth");
  });
});
