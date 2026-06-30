import { describe, expect, it } from "vitest";
import {
  activateParticipationSpaceAfterReview,
  approveParticipationSpaceActivation,
  approveParticipationSpacePublication,
  blocksParticipationSpaceAutoActivation,
  blocksParticipationSpaceAutoPublish,
  blocksUnsafePublicVisibility,
  buildParticipationSpacePublishDraft,
  canApproveParticipationSpacePublication,
  canPublishParticipationSpace,
  getParticipationSpacePublishBlockers,
  publishParticipationSpaceAfterReview,
  type ParticipationSpacePublishRecord,
} from "@/features/create/participationSpacePublishWorkflow";
import {
  buildParticipationSpaceRuntimeDraftFromHandoff,
  type ParticipationSpaceRuntimeRecord,
} from "@/features/create/participationSpaceRuntime";
import type { PersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";

function buildHandoffRecord(): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "handoff-participation-publish-1",
    source: "create",
    sourceText:
      "Vor Schulen fehlen sichere Querungen und der Kiez braucht einen öffentlichen Beteiligungsstand.",
    plannerResult: {
      shortSummary:
        "Sichere Schulwege sollen als Beteiligungsraum mit klarer Leitfrage weitergeführt werden.",
      openQuestion: "Welche Kreuzungen sind zuerst kritisch?",
      openQuestions: ["Welche Kreuzungen sind zuerst kritisch?"],
      topicCandidates: ["Sichere Schulwege"],
    } as any,
    graphMatches: {
      matches: [{ kind: "topic", label: "Sichere Schulwege" }],
      matchedTopics: ["Sichere Schulwege"],
      matchedDossiers: ["dossier-sichere-schulwege"],
      matchedAnlassraeume: ["65a111111111111111111110"],
      shouldCreateNewTopic: true,
    } as any,
    selectedAction: "prepare_participation_space",
    claims: [],
    arguments: [
      {
        id: "argument-1",
        text: "Kinder brauchen sichere Wege zum Unterricht.",
        stance: "pro",
        supportsClaimIds: [],
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
    resumeHref: "/create?resume=handoff-participation-publish-1",
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
    dossierId: "dossier-sichere-schulwege",
    anlassraumId: "65a111111111111111111110",
    requestScope: null,
    accessDecision: null,
    createdAt: "2026-06-30T08:00:00.000Z",
    updatedAt: "2026-06-30T08:00:00.000Z",
  };
}

function buildRuntimeRecord(
  overrides: Partial<ParticipationSpaceRuntimeRecord> = {},
): ParticipationSpaceRuntimeRecord {
  const draft = buildParticipationSpaceRuntimeDraftFromHandoff(buildHandoffRecord(), {
    status: "created",
    visibility: "active_internal",
    createdParticipationSpaceId: "participation-space-1",
    createdParticipationSpaceSlug: "sichere-schulwege",
    auditContext: {
      actorUserId: "admin-1",
      reason: "Review-approved creation.",
      origin: "participation_space_runtime",
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
        participationSpaceId: "participation-space-1",
        participationSpaceSlug: "sichere-schulwege",
      },
    ],
    approvedForCreationAt: "2026-06-30T08:30:00.000Z",
    approvedForCreationBy: "admin-1",
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

function buildPublishRecord(
  overrides: Partial<ParticipationSpacePublishRecord> = {},
): ParticipationSpacePublishRecord {
  const draft = buildParticipationSpacePublishDraft({
    runtimeRecord: buildRuntimeRecord(),
    createdSpace: {
      id: "participation-space-1",
      slug: "sichere-schulwege",
      status: "review_active",
      visibility: "review_only",
      publicHeadline: "Sichere Schulwege im Blick",
      publicSummary:
        "Der Beteiligungsraum bündelt Hinweise zu Querungen, Schulwegen und offenen Prüfpfaden.",
      publicFeedbackAvailable: false,
      updatedAt: "2026-06-30T09:00:00.000Z",
    },
    creationAudited: true,
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
    approvedForActivationAt: null,
    approvedForActivationBy: null,
    approvedForPublicationAt: null,
    approvedForPublicationBy: null,
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

describe("participation space publish workflow", () => {
  it("keeps created participation spaces non-public until explicit publication", () => {
    const record = buildPublishRecord();

    expect(record.status).toBe("draft");
    expect(record.visibility).toBe("editorial_workspace");
    expect(record.spaceVisibility).toBe("review_only");
    expect(blocksParticipationSpaceAutoPublish(record)).toBe(false);
    expect(blocksUnsafePublicVisibility(record)).toBe(false);
    expect(getParticipationSpacePublishBlockers(record)).toContain(
      "activation_not_approved",
    );
    expect(getParticipationSpacePublishBlockers(record)).toContain(
      "publication_not_approved",
    );
  });

  it("keeps approved activation and active_internal separate from public visibility", () => {
    const approved = approveParticipationSpaceActivation(buildPublishRecord(), {
      actorUserId: "admin-1",
      reason: "Aktivierung freigegeben.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:20:00.000Z",
    });

    expect(approved.status).toBe("approved_for_activation");
    expect(approved.visibility).toBe("editorial_workspace");
    expect(approved.spaceVisibility).toBe("review_only");
    expect(approved.visibility).not.toBe("public");

    const activated = activateParticipationSpaceAfterReview(approved, {
      actorUserId: "admin-1",
      reason: "Intern aktivieren.",
      origin: "participation_space_publish_workflow",
      approvedAt: "2026-06-30T09:30:00.000Z",
    });

    expect(activated.ok).toBe(true);
    if (activated.ok) {
      expect(activated.record.status).toBe("activated");
      expect(activated.record.visibility).toBe("active_internal");
      expect(activated.record.spaceStatus).toBe("feedback_prepared");
      expect(activated.record.spaceVisibility).toBe("review_only");
      expect(activated.record.visibility).not.toBe("public");
      expect(blocksParticipationSpaceAutoActivation(activated.record)).toBe(
        false,
      );
      expect(blocksUnsafePublicVisibility(activated.record)).toBe(false);
    }
  });

  it("requires activation before publication approval and publication before public visibility", () => {
    const draft = buildPublishRecord();
    expect(canApproveParticipationSpacePublication(draft)).toBe(false);
    expect(canPublishParticipationSpace(draft)).toBe(false);
    expect(getParticipationSpacePublishBlockers(draft)).toContain(
      "publication_not_approved",
    );

    const approvedActivation = approveParticipationSpaceActivation(draft, {
      actorUserId: "admin-1",
      reason: "Aktivierung freigegeben.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:20:00.000Z",
    });
    const activated = activateParticipationSpaceAfterReview(approvedActivation, {
      actorUserId: "admin-1",
      reason: "Intern aktivieren.",
      origin: "participation_space_publish_workflow",
      approvedAt: "2026-06-30T09:30:00.000Z",
    });

    expect(activated.ok).toBe(true);
    if (!activated.ok) return;

    const approvedPublication = approveParticipationSpacePublication(
      activated.record,
      {
        actorUserId: "admin-1",
        reason: "Veröffentlichung freigegeben.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:40:00.000Z",
      },
    );

    expect(approvedPublication.status).toBe("approved_for_publication");
    expect(approvedPublication.visibility).toBe("ready_for_publication_review");
    expect(approvedPublication.visibility).not.toBe("public");
    expect(approvedPublication.spaceVisibility).toBe("review_only");
    expect(canPublishParticipationSpace(approvedPublication)).toBe(true);

    const published = publishParticipationSpaceAfterReview(approvedPublication, {
      actorUserId: "admin-1",
      reason: "Öffentlich sichtbar machen.",
      origin: "participation_space_publish_workflow",
      approvedAt: "2026-06-30T09:50:00.000Z",
    });

    expect(published.ok).toBe(true);
    if (published.ok) {
      expect(published.record.status).toBe("published");
      expect(published.record.visibility).toBe("public");
      expect(published.record.spaceVisibility).toBe("public_read_only");
      expect(blocksParticipationSpaceAutoPublish(published.record)).toBe(false);
      expect(blocksUnsafePublicVisibility(published.record)).toBe(false);
    }
  });

  it("treats creation approval as insufficient for publication approval", () => {
    const record = buildPublishRecord({
      runtimeStatus: "created",
      runtimeVisibility: "active_internal",
      status: "draft",
    });

    expect(canApproveParticipationSpacePublication(record)).toBe(false);
    expect(getParticipationSpacePublishBlockers(record)).toContain(
      "activation_not_approved",
    );
    expect(getParticipationSpacePublishBlockers(record)).toContain(
      "publication_not_approved",
    );
  });

  it("blocks publication on source, moderation, abuse and trust blockers", () => {
    const blocked = buildPublishRecord({
      sourceStatus: "source_review_pending",
      moderationPending: true,
      unresolvedAbuseSignal: true,
      unresolvedTrustQualityBlocker: true,
      status: "approved_for_publication",
      visibility: "ready_for_publication_review",
    });

    const blockers = getParticipationSpacePublishBlockers(blocked, "publication");
    expect(blockers).toContain("source_review_pending");
    expect(blockers).toContain("moderation_pending");
    expect(blockers).toContain("unresolved_abuse_signal");
    expect(blockers).toContain("unresolved_trust_quality_blocker");
    expect(canPublishParticipationSpace(blocked)).toBe(false);
  });

  it("blocks publication when public copy or moderation policy are missing", () => {
    const blocked = buildPublishRecord({
      status: "approved_for_publication",
      visibility: "ready_for_publication_review",
      publicHeadline: "",
      publicSummary: "",
      moderationPolicy: null,
    });

    const blockers = getParticipationSpacePublishBlockers(blocked, "publication");
    expect(blockers).toContain("public_copy_missing");
    expect(blockers).toContain("moderation_policy_missing");
    expect(canPublishParticipationSpace(blocked)).toBe(false);
  });

  it("keeps community, trust, dossier, anlassraum and graph context as review-only hints", () => {
    const record = buildPublishRecord();

    expect(record.guardrails.noCommunityHintsAsTruth).toBe(true);
    expect(record.guardrails.noTrustOrSourceQualityAsVerification).toBe(true);
    expect(record.guardrails.noGraphEdgeAsProof).toBe(true);
    expect(record.guardrails.noDossierContextAsProof).toBe(true);
    expect(record.guardrails.noAnlassraumContextAsProof).toBe(true);
    expect(record.guardrails.noMajorityAsTruth).toBe(true);
    expect(record.relatedDossierId).toBe("dossier-sichere-schulwege");
    expect(record.relatedAnlassraumId).toBe("65a111111111111111111110");
  });

  it("preserves no auto-activation, no auto-publish, no auto-graph and no auto-merge guardrails", () => {
    const record = buildPublishRecord();

    expect(record.guardrails.noAutoActivationFromCreation).toBe(true);
    expect(record.guardrails.noAutoPublishFromCreation).toBe(true);
    expect(record.guardrails.noAutoGraphWrite).toBe(true);
    expect(record.guardrails.noAutoMerge).toBe(true);
    expect(record.guardrails.auditContextRequired).toBe(true);
  });
});
