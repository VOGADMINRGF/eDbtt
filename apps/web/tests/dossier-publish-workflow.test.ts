import { describe, expect, it } from "vitest";
import {
  approveDossierPublication,
  buildDossierPublicationDraft,
  getDossierPublicationBlockers,
  isPublicDossier,
  publishDossier,
  requestDossierPublicationReview,
  stripDossierInternalFieldsForPublic,
  summarizeDossierPublicationState,
  unpublishDossier,
  type DossierPublicationRecord,
} from "@/features/create/dossierPublishWorkflow";
import {
  buildDossierRuntimeDraftFromHandoff,
  type DossierRuntimeRecord,
} from "@/features/create/dossierRuntime";
import type { PersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";

function buildHandoffRecord(): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "handoff-dossier-publish-1",
    source: "create",
    sourceText: "Vor Schulen fehlen sichere Querungen und klare Temporegeln.",
    plannerResult: {
      shortSummary: "Sichere Schulwege sollen als Dossier strukturiert geprüft werden.",
      openQuestion: "Welche Kreuzungen sind zuerst kritisch?",
      openQuestions: ["Welche Kreuzungen sind zuerst kritisch?"],
      topicCandidates: ["Sichere Schulwege"],
    } as any,
    graphMatches: {
      matches: [{ kind: "topic", label: "Sichere Schulwege" }],
      matchedTopics: ["Sichere Schulwege"],
      matchedDossiers: [],
      matchedAnlassraeume: [],
      shouldCreateNewTopic: true,
    } as any,
    selectedAction: "create_dossier",
    claims: [
      {
        id: "claim-1",
        text: "Vor Schulen fehlen sichere Querungen.",
        kind: "factual_claim",
        factcheckEligible: true,
        sourceRefs: [],
      },
    ],
    arguments: [
      {
        id: "argument-1",
        text: "Kinder brauchen sichere Wege zum Unterricht.",
        stance: "pro",
        supportsClaimIds: ["claim-1"],
      },
    ],
    openQuestions: [
      {
        id: "question-1",
        question: "Welche Schulen sind besonders betroffen?",
        requiredBeforePublish: true,
      },
    ],
    sourceGrounding: [],
    topicSeed: {
      topicKey: "sichere-schulwege",
      topicLabel: "Sichere Schulwege",
      jurisdiction: "kommune",
      themenradarSourceType: "create_intake",
    },
    resumeHref: "/create?resume=handoff-dossier-publish-1",
    reviewState: "manual_review_required",
    visibilityState: "internal_review",
    requiresConfirmation: true,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    intakeClassification: "public_policy",
    createdByUserId: "admin-1",
    regionId: "berlin-reinickendorf",
    organizationId: "org-1",
    dossierId: null,
    anlassraumId: null,
    requestScope: null,
    accessDecision: null,
    createdAt: "2026-06-30T08:00:00.000Z",
    updatedAt: "2026-06-30T08:00:00.000Z",
  };
}

function buildRuntimeRecord(
  overrides: Partial<DossierRuntimeRecord> = {},
): DossierRuntimeRecord {
  const draft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
    status: "created",
    visibility: "editorial_workspace",
    createdDossierId: "dossier-sichere-schulwege",
    createdWorkspaceId: "studio-workspace-1",
    auditContext: {
      actorUserId: "admin-1",
      reason: "Review-approved creation.",
      origin: "dossier_runtime",
      approvedAt: "2026-06-30T09:00:00.000Z",
    },
  });

  return {
    ...draft,
    auditTrail: [
      {
        id: "runtime-created-1",
        sourceHandoffId: draft.sourceHandoffId,
        at: "2026-06-30T09:00:00.000Z",
        action: "runtime_created",
        actorUserId: "admin-1",
        note: "Runtime erstellt.",
        blockers: [],
        status: "created",
        dossierId: "dossier-sichere-schulwege",
        workspaceId: "studio-workspace-1",
      },
    ],
    approvedForCreationAt: "2026-06-30T08:30:00.000Z",
    approvedForCreationBy: "admin-1",
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

function buildPublicationRecord(
  overrides: Partial<DossierPublicationRecord> = {},
): DossierPublicationRecord {
  const draft = buildDossierPublicationDraft(buildRuntimeRecord(), {
    auditContext: {
      actorUserId: "admin-1",
      reason: "Audit vorhanden.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:10:00.000Z",
    },
  });

  return {
    ...draft,
    auditTrail: [],
    approvedForPublicationAt: null,
    approvedForPublicationBy: null,
    rejectedAt: null,
    rejectedBy: null,
    unpublishedAt: null,
    unpublishedBy: null,
    archivedAt: null,
    archivedBy: null,
    ...overrides,
  };
}

describe("dossier publish workflow", () => {
  it("keeps created dossiers non-public until publication review, approval and publish happen explicitly", () => {
    const record = buildPublicationRecord();

    expect(record.status).toBe("review_only");
    expect(record.visibility).toBe("internal");
    expect(record.publicAccessMode).toBe("none");
    expect(isPublicDossier(record)).toBe(false);
    expect(getDossierPublicationBlockers(record)).toContain(
      "publication_review_not_requested",
    );
    expect(getDossierPublicationBlockers(record)).toContain(
      "publication_not_approved",
    );
  });

  it("keeps publication approval separate from publish and fact verification", () => {
    const requested = requestDossierPublicationReview(buildPublicationRecord(), {
      actorUserId: "admin-1",
      reason: "Veröffentlichungsprüfung anfordern.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:20:00.000Z",
    });
    const approved = approveDossierPublication(requested, {
      actorUserId: "admin-1",
      reason: "Veröffentlichung freigeben.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:30:00.000Z",
    });

    expect(approved.status).toBe("approved_for_publication");
    expect(approved.visibility).toBe("internal");
    expect(approved.publicAccessMode).toBe("none");
    expect(isPublicDossier(approved)).toBe(false);
    expect(
      approved.guardrails.publicationApprovalIsNotFactVerification,
    ).toBe(true);
    expect(approved.guardrails.noAutoFactcheck).toBe(true);
  });

  it("publishes only with explicit publish and can unpublish again", () => {
    const approved = approveDossierPublication(
      requestDossierPublicationReview(buildPublicationRecord(), {
        actorUserId: "admin-1",
        reason: "Review anfordern.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:20:00.000Z",
      }),
      {
        actorUserId: "admin-1",
        reason: "Freigeben.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:30:00.000Z",
      },
    );

    const published = publishDossier(approved, {
      actorUserId: "admin-1",
      reason: "Öffentlich sichtbar machen.",
      origin: "dossier_publish_workflow",
      approvedAt: "2026-06-30T09:40:00.000Z",
    });

    expect(published.ok).toBe(true);
    if (!published.ok) return;

    expect(published.record.status).toBe("published");
    expect(published.record.visibility).toBe("public");
    expect(published.record.publicAccessMode).toBe("public_read_only");
    expect(isPublicDossier(published.record)).toBe(true);

    const unpublished = unpublishDossier(published.record, {
      actorUserId: "admin-1",
      reason: "Zurückziehen.",
      origin: "dossier_publish_workflow",
      approvedAt: "2026-06-30T09:50:00.000Z",
    });

    expect(unpublished.status).toBe("unpublished");
    expect(unpublished.visibility).toBe("internal");
    expect(unpublished.publicAccessMode).toBe("none");
    expect(isPublicDossier(unpublished)).toBe(false);
  });

  it("strips internal fields for public output", () => {
    const stripped = stripDossierInternalFieldsForPublic({
      id: "dossier-1",
      title: "Sichere Schulwege",
      auditTrail: [{ id: "audit-1" }],
      adminNotes: "intern",
      reviewIds: ["review-1"],
      moderationStatus: "pending",
      trustLevel: "low",
      privateNotes: "nur intern",
      graphInternals: { foo: "bar" },
      nested: {
        summary: "sichtbar",
        auditContext: { actorUserId: "admin-1" },
      },
    });

    expect(stripped).toEqual({
      id: "dossier-1",
      title: "Sichere Schulwege",
      nested: {
        summary: "sichtbar",
      },
    });
  });

  it("keeps guardrails against graph, merge and side-entity creation visible", () => {
    const record = buildPublicationRecord();

    expect(record.guardrails.noAutoGraphWrite).toBe(true);
    expect(record.guardrails.noAutoMerge).toBe(true);
    expect(record.guardrails.noAutoAnlassraumCreation).toBe(true);
    expect(record.guardrails.noAutoParticipationSpaceCreation).toBe(true);
    expect(summarizeDossierPublicationState(record)).toContain("Intern");
  });
});
