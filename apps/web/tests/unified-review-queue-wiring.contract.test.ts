import { describe, expect, it } from "vitest";
import {
  buildDossierWorkspaceV3ReviewContext,
  buildPersistedCreateHandoffV3ReviewContext,
  buildSocialDistributionPostV3ReviewContext,
} from "@/features/create/unifiedReviewQueueWiring";

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
    provenance: {},
  } as any;
}

function createSocialDistributionPost() {
  return {
    id: "social-dist-1",
    organizationId: "org-reinickendorf-1",
    regionId: "bezirk-berlin-reinickendorf",
    dossierId: "dossier-1",
    sourceContextType: "dossier",
    sourceContextId: "dossier-1",
    sourceVisibilityState: "public_reviewed",
    sourceState: "approved_context",
    title: "Schulsanierung Studio",
    status: "review_requested",
    channels: ["website_update", "newsletter_draft"],
    assets: [
      {
        id: "asset-1",
        channel: "website_update",
        kind: "channel_text",
        label: "Website-Update",
        href: "/dossier/dossier-1",
        text: "Sachlicher Update-Entwurf für das Dossier.",
        sealGranted: false,
      },
    ],
    sourceSummary: "Freigegebener Dossier-Kontext mit Review-first Verteilung.",
    createdByUserId: "user-1",
    createdAt: "2026-05-19T09:10:00.000Z",
    updatedAt: "2026-05-19T09:10:00.000Z",
  } as any;
}

describe("unified review queue wiring", () => {
  it("maps persisted create handoffs into review-first V3 queue context", () => {
    const context = buildPersistedCreateHandoffV3ReviewContext(
      createPersistedHandoffRecord(),
    );

    expect(context.primaryUnifiedItem).toEqual(
      expect.objectContaining({
        source: "create_handoff",
        reviewRequired: true,
        autoPublish: false,
        publishReadyIsPublished: false,
      }),
    );
    expect(context.participationCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidateType: "live_question_candidate",
        }),
      ]),
    );
    expect(context.unifiedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "create_handoff" }),
        expect.objectContaining({ source: "participation_candidate" }),
      ]),
    );
  });

  it("composes dossier workspace review surfaces with social and voxy handoffs", () => {
    const context = buildDossierWorkspaceV3ReviewContext({
      workspace: createWorkspace(),
      sourceRecord: createPersistedHandoffRecord(),
    });

    expect(context.dossierWorkspaceSurface).toEqual(
      expect.objectContaining({
        dossierId: "dossier-1",
        guardrails: expect.objectContaining({
          noAutoPublish: true,
          noAutoSocialPosting: true,
          reviewRequired: true,
        }),
        sections: expect.objectContaining({
          claims: expect.arrayContaining([
            "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
          ]),
          counterPositions: expect.arrayContaining([
            "Die Priorisierung einzelner Standorte ist noch offen.",
          ]),
          socialOutputDrafts: expect.arrayContaining([
            "website_update_draft",
            "newsletter_draft",
            "linkedin_draft",
            "press_note_draft",
            "carousel_draft",
            "short_video_script_draft",
          ]),
        }),
      }),
    );
    expect(context.voxyRenderJob).toEqual(
      expect.objectContaining({
        status: "ready_after_review",
        renderTriggered: false,
      }),
    );
    expect(context.voxyPublishDraft).toEqual(
      expect.objectContaining({
        status: "draft_only",
        autoPublish: false,
        publishReadyIsPublished: false,
      }),
    );
    expect(context.unifiedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "create_handoff" }),
        expect.objectContaining({ source: "social_output_draft" }),
        expect.objectContaining({ source: "voxy_video_briefing" }),
      ]),
    );
  });

  it("keeps social distribution drafts in review-only draft semantics", () => {
    const context = buildSocialDistributionPostV3ReviewContext(
      createSocialDistributionPost(),
    );

    expect(context.primaryUnifiedItem).toEqual(
      expect.objectContaining({
        source: "social_output_draft",
        autoPublish: false,
        publishReadyIsPublished: false,
      }),
    );
    expect(context.socialOutputDrafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "website_update_draft" }),
        expect.objectContaining({ kind: "newsletter_draft" }),
      ]),
    );
    expect(context.languageBridge).toBeNull();
    expect(context.voxyBriefing).toBeNull();
  });
});
