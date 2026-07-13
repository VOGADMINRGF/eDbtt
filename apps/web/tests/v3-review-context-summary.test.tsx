import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import V3ReviewContextSummary from "@/features/create/V3ReviewContextSummary";
import {
  buildDossierWorkspaceV3ReviewContext,
  buildPersistedCreateHandoffV3ReviewContext,
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
    officialApproval: {
      approvedByUserId: "admin-1",
      approvedAt: "2026-05-17T11:00:00.000Z",
      authority: "publication_approved",
      note: "Freigabe bleibt manuell.",
    },
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

describe("V3ReviewContextSummary", () => {
  it("renders create handoff review context without leaking internal enum names", () => {
    const html = renderToStaticMarkup(
      <V3ReviewContextSummary
        context={buildPersistedCreateHandoffV3ReviewContext(createPersistedHandoffRecord())}
        audience="admin"
      />,
    );

    expect(html).toContain("Redaktionelle Prüfung");
    expect(html).toContain("Bereit für Prüfung");
    expect(html).toContain("UI-Sprache: Deutsch");
    expect(html).toContain("Originalsprache: Deutsch");
    expect(html).toContain("Lesefassung: Deutsch");
    expect(html).toContain("keine getrennte Lesefassung nötig");
    expect(html).toContain(
      "Original bleibt Evidenz und Review-Grundlage.",
    );
    expect(html).not.toContain("review_ready");
    expect(html).not.toContain("queued_for_review");
  });

  it("keeps publish-ready review-first, separates language layers and humanizes blockers", () => {
    const context = buildDossierWorkspaceV3ReviewContext({
      workspace: createWorkspace(),
      sourceRecord: createPersistedHandoffRecord(),
    });
    context.voxyRenderJob = {
      ...context.voxyRenderJob!,
      status: "blocked_by_provider",
    };

    const html = renderToStaticMarkup(
      <V3ReviewContextSummary context={context} audience="workspace" />,
    );

    expect(html).toContain("Bereit für Freigabe");
    expect(html).not.toContain("Veröffentlicht");
    expect(html).toContain("UI-Sprache: Deutsch");
    expect(html).toContain("Originalsprache: Deutsch");
    expect(html).toContain("Lesefassung: Deutsch");
    expect(html).toContain("Social-Entwürfe");
    expect(html).toContain("Voxy-Briefing: Anbieter-Anbindung fehlt");
    expect(html).not.toContain("blocked_by_provider");
    expect(html).not.toContain("publish_ready");
  });
});
