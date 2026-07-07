import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import V3RuntimeWorkflowSurface, {
  buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview,
  buildV3RuntimeWorkflowSurfaceFromReviewContext,
} from "@/features/create/V3RuntimeWorkflowSurface";
import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import { buildDossierWorkspaceV3ReviewContext } from "@/features/create/unifiedReviewQueueWiring";

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

function createPersistedHandoffRecord() {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "create-handoff-1",
    source: "create",
    sourceText: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
    plannerResult: {
      shortSummary: "Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
      topicCandidates: ["Schulsanierung"],
      openQuestions: ["Welche Standorte haben Priorität?"],
    },
    graphMatches: {
      matches: [{ kind: "dossier", label: "Schulsanierung Studio" }],
      matchedDossiers: ["dossier-1"],
    },
    selectedAction: "create_dossier",
    claims: [
      {
        id: "claim-1",
        text: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
        factcheckEligible: true,
        sourceRefs: ["source-text"],
      },
    ],
    arguments: [
      {
        id: "argument-1",
        text: "Die Priorisierung einzelner Standorte ist noch offen.",
        stance: "contra",
      },
    ],
    openQuestions: [
      {
        id: "question-1",
        question: "Welche Standorte haben Priorität?",
        requiredBeforePublish: true,
      },
    ],
    sourceGrounding: [
      {
        id: "source-text",
        label: "Ausgangstext",
        status: "source_text",
        detail: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
      },
    ],
    topicSeed: {
      topicKey: "schulsanierung-im-bezirk",
      topicLabel: "Schulsanierung im Bezirk",
    },
    resumeHref: "/create?resume=create_handoff&handoffId=create-handoff-1",
    reviewState: "ready_for_confirmation",
    visibilityState: "internal_review",
    requiresConfirmation: true,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    intakeClassification: "free_text",
    createdByUserId: "user-1",
    regionId: "bezirk-berlin-reinickendorf",
    organizationId: "org-reinickendorf-1",
    dossierId: "dossier-1",
    anlassraumId: null,
    requestScope: {
      organizationLabel: "Bezirksamt Reinickendorf",
      sourceOfTruth: "operator_verified_directory",
    },
    accessDecision: {
      status: "allowed",
    },
    createdAt: "2026-05-19T08:00:00.000Z",
    updatedAt: "2026-05-19T08:00:00.000Z",
  } as any;
}

function createWorkspace() {
  return {
    id: "workspace-1",
    dossierId: "dossier-1",
    regionId: "bezirk-berlin-reinickendorf",
    organizationId: "org-reinickendorf-1",
    source: "region_signal_draft",
    status: "needs_review",
    visibilityState: "internal_review",
    title: "Schulsanierung Studio",
    masterPostDraft: {
      topic: "Schulsanierung",
      overallPicture: "Sachlicher Lageüberblick zur Schulsanierung.",
      sourceSituation: "Quellenlage muss vor Veröffentlichung weiter geprüft werden.",
      body: "Master-Post für das Dossier.",
      hook: "Was ist der aktuelle Stand?",
      participationQuestion: "Welche Standorte sollten zuerst geprüft werden?",
      openQuestions: ["Welche Standorte haben Priorität?"],
      sourceState: {
        status: "missing",
        traces: [],
        notes: ["context_missing"],
      },
      reviewStatus: "review_required",
    },
    distributionDraft: {
      selectedChannels: [
        "website_update",
        "newsletter_draft",
        "linkedin_draft",
        "press_note",
      ],
    },
    carouselDraft: {
      slides: [{ message: "Carousel-Draft zur Schulsanierung." }],
    },
    audienceNotes: "Öffentliche Lesefassung erst nach Review.",
    reviewNotes: "Workspace bleibt reviewpflichtig.",
    createdBy: "user-1",
    updatedBy: "user-1",
    createdAt: "2026-05-17T10:00:00.000Z",
    updatedAt: "2026-05-17T10:30:00.000Z",
    officialApproval: null,
    provenance: {
      sourceDraftId: "create-handoff-1",
    },
    guardrails: {
      noAutoPublish: true,
      noSocialPublishing: true,
      noAutoMandate: true,
      noAutoVote: true,
      reviewRequired: true,
      localStorageIsNotProduction: true,
    },
  } as any;
}

describe("V3RuntimeWorkflowSurface", () => {
  it("renders create-side preview flow without inventing output runtime", () => {
    const model = buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview(
      buildCreateCandidatePreviewReadModel({
        followup: buildFollowupFixture(),
        draftId: "65a111111111111111111122",
        sourceUrls: ["https://example.org/schulwege"],
        materialItems: [],
      }),
    );

    const html = renderToStaticMarkup(<V3RuntimeWorkflowSurface model={model} />);

    expect(html).toContain("V3-Arbeitsfluss ab hier");
    expect(html).toContain("Create / Handoff");
    expect(html).toContain("Nur Vorschau");
    expect(html).toContain("Anlassraum / Beteiligung");
    expect(html).toContain("Output Drafts");
    expect(html).toContain("Keine Fake-Output-Drafts in /create");
  });

  it("renders dossier-side flow with active output drafts and blocked voxy provider state", () => {
    const model = buildV3RuntimeWorkflowSurfaceFromReviewContext(
      buildDossierWorkspaceV3ReviewContext({
        workspace: createWorkspace(),
        sourceRecord: createPersistedHandoffRecord(),
      }),
    );

    const html = renderToStaticMarkup(<V3RuntimeWorkflowSurface model={model} />);

    expect(html).toContain("V3-Arbeitsfluss über bestehende Flächen");
    expect(html).toContain("Bestehende Fläche aktiv");
    expect(html).toContain("Dossier Workspace");
    expect(html).toContain("Output Drafts");
    expect(html).toContain("Voxy Briefing");
    expect(html).toContain("Nur Vorschau");
    expect(html).toContain("Kein echter Voxy-Render");
  });
});
