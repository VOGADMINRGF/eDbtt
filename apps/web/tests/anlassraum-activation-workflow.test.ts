import { describe, expect, it } from "vitest";
import {
  activateAnlassraumAfterReview,
  approveAnlassraumActivation,
  approveAnlassraumPublication,
  blocksAnlassraumAutoActivation,
  blocksAnlassraumAutoPublish,
  blocksUnsafeAnlassraumPublicVisibility,
  buildAnlassraumActivationDraft,
  canApproveAnlassraumPublication,
  canPublishAnlassraum,
  getAnlassraumActivationBlockers,
  publishAnlassraumAfterReview,
  reviewAnlassraumQuestionGuard,
  type AnlassraumActivationRecord,
} from "@/features/create/anlassraumActivationWorkflow";
import {
  buildAnlassraumRuntimeDraftFromHandoff,
  type AnlassraumRuntimeRecord,
} from "@/features/create/anlassraumRuntime";
import type { PersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";
import { evaluatePublicQuestionGeneralization } from "@/features/create/safety/publicQuestionGeneralization";
import { persistQuestionGuardReviewFailClosed } from "@/features/create/safety/questionGuardReviewPersistence";

function buildHandoffRecord(): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "handoff-anlassraum-activation-1",
    source: "create",
    sourceText:
      "Vor Schulen fehlen sichere Querungen und der Kiez braucht einen sichtbaren Themenraum.",
    plannerResult: {
      shortSummary:
        "Sichere Schulwege sollen als Anlassraum weitergeführt werden.",
      openQuestion: "Welche Maßnahmen sollten sichere Schulwege zuerst verbessern?",
      openQuestions: [
        "Welche Maßnahmen sollten sichere Schulwege zuerst verbessern?",
      ],
      topicCandidates: ["Sichere Schulwege"],
    } as any,
    graphMatches: {
      matches: [{ kind: "topic", label: "Sichere Schulwege" }],
      matchedTopics: ["Sichere Schulwege"],
      matchedDossiers: ["dossier-sichere-schulwege"],
      matchedAnlassraeume: [],
      shouldCreateNewTopic: true,
    } as any,
    selectedAction: "prepare_anlassraum",
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
    resumeHref: "/create?resume=handoff-anlassraum-activation-1",
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
    anlassraumId: null,
    requestScope: null,
    accessDecision: null,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  };
}

function buildRuntimeRecord(
  overrides: Partial<AnlassraumRuntimeRecord> = {},
): AnlassraumRuntimeRecord {
  const handoff = buildHandoffRecord();
  const draft = buildAnlassraumRuntimeDraftFromHandoff(handoff, {
    status: "created",
    visibility: "ready_for_activation_review",
    createdAnlassraumId: "65a111111111111111111110",
    auditContext: {
      actorUserId: "admin-1",
      reason: "Review-approved creation.",
      origin: "anlassraum_runtime",
      approvedAt: "2026-07-01T09:00:00.000Z",
    },
  });

  return {
    ...draft,
    questionGuard: evaluatePublicQuestionGeneralization({
      originalInput: handoff.sourceText,
      candidatePublicQuestion: draft.trigger,
      actorContexts: [],
      actorExtraction: {
        status: "complete",
        source: "actor_graph",
        independentFromCandidateProvider: true,
        evidenceRefs: ["actor-graph-review:anlassraum-activation-1"],
      },
    }),
    auditTrail: [
      {
        id: "runtime-created-1",
        sourceHandoffId: draft.sourceHandoffId,
        at: "2026-07-01T09:00:00.000Z",
        action: "runtime_created",
        actorUserId: "admin-1",
        note: "Runtime erstellt.",
        blockers: [],
        status: "created",
        anlassraumId: "65a111111111111111111110",
        entityId: "65a111111111111111111120",
      },
    ],
    approvedForCreationAt: "2026-07-01T08:30:00.000Z",
    approvedForCreationBy: "admin-1",
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

function buildActivationRecord(
  overrides: Partial<AnlassraumActivationRecord> = {},
): AnlassraumActivationRecord {
  const draft = buildAnlassraumActivationDraft({
    runtimeRecord: buildRuntimeRecord(),
    createdRoom: {
      id: "65a111111111111111111110",
      slug: "sichere-schulwege",
      status: "approved",
      isPublic: false,
      updatedAt: "2026-07-01T09:00:00.000Z",
    },
    creationAudited: true,
    auditContext: {
      actorUserId: "admin-1",
      reason: "Audit vorhanden.",
      origin: "admin_review",
      approvedAt: "2026-07-01T09:10:00.000Z",
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

describe("anlassraum activation workflow", () => {
  it("carries a blocked source question into the activation blocker set", () => {
    const handoff = buildHandoffRecord();
    handoff.sourceText = "Sollen wir diese Gruppe verprügeln?";
    handoff.plannerResult.openQuestions = [
      "Welche Maßnahmen sollten Konflikte friedlich lösen?",
    ];
    const runtimeDraft = buildAnlassraumRuntimeDraftFromHandoff(handoff, {
      status: "created",
      visibility: "ready_for_activation_review",
      createdAnlassraumId: "65a111111111111111111119",
    });
    const runtimeRecord: AnlassraumRuntimeRecord = {
      ...runtimeDraft,
      auditTrail: [],
      approvedForCreationAt: null,
      approvedForCreationBy: null,
      rejectedAt: null,
      rejectedBy: null,
    };
    const activationDraft = buildAnlassraumActivationDraft({
      runtimeRecord,
      createdRoom: null,
      creationAudited: false,
    });

    expect(activationDraft.questionGuard.outcome).toBe("safety_blocked");
    expect(activationDraft.blockers).toContain("public_question_guard_blocked");
  });

  it("blocks activation while public-question review remains unresolved", () => {
    const unresolvedQuestionGuard = buildAnlassraumRuntimeDraftFromHandoff(
      buildHandoffRecord(),
    ).questionGuard;
    const record = buildActivationRecord({
      questionGuard: unresolvedQuestionGuard,
      status: "approved_for_activation",
      approvedForActivationAt: "2026-07-01T09:20:00.000Z",
      approvedForActivationBy: "admin-1",
    });

    expect(record.questionGuard.releaseState).toBe("review_required");
    expect(getAnlassraumActivationBlockers(record)).toContain(
      "public_question_guard_blocked",
    );

    const activated = activateAnlassraumAfterReview(record, {
      actorUserId: "admin-1",
      reason: "Intern aktivieren.",
      origin: "anlassraum_activation_workflow",
      approvedAt: "2026-07-01T09:30:00.000Z",
    });

    expect(activated.ok).toBe(false);
    if (!activated.ok) {
      expect(activated.blockers).toContain("public_question_guard_blocked");
    }
  });

  it("invalidates earlier approvals and persists review audit before releasing the guard", async () => {
    const unresolvedQuestionGuard = buildAnlassraumRuntimeDraftFromHandoff(
      buildHandoffRecord(),
    ).questionGuard;
    const record = buildActivationRecord({
      questionGuard: unresolvedQuestionGuard,
      status: "approved_for_publication",
      visibility: "ready_for_publication_review",
      publicAccessMode: "internal_only",
      approvedForActivationAt: "2026-07-01T09:05:00.000Z",
      approvedForActivationBy: "admin-before-review",
      approvedForPublicationAt: "2026-07-01T09:10:00.000Z",
      approvedForPublicationBy: "admin-before-review",
    });

    expect(() =>
      reviewAnlassraumQuestionGuard(record, {
        actorExtractionSource: "material_provider" as never,
        evidenceRefs: ["self-attested:material-provider"],
      }),
    ).toThrow("public_question_guard_review_source_invalid");
    expect(() =>
      reviewAnlassraumQuestionGuard(record, {
        actorExtractionSource: "actor_graph",
        evidenceRefs: [" "],
      }),
    ).toThrow("public_question_guard_review_evidence_required");

    const reviewed = reviewAnlassraumQuestionGuard(record, {
      actorExtractionSource: "actor_graph",
      evidenceRefs: ["actor-graph:anlassraum-question-guard-1"],
      reviewedAt: "2026-07-01T09:15:00.000Z",
    });

    expect(reviewed.questionGuard.releaseState).toBe("draft_allowed");
    expect(reviewed.questionGuard.actorExtraction).toEqual({
      status: "complete",
      source: "actor_graph",
      independentFromCandidateProvider: true,
      evidenceRefs: ["actor-graph:anlassraum-question-guard-1"],
    });
    expect(reviewed.blockers).not.toContain("public_question_guard_blocked");
    expect(reviewed.status).toBe("draft");
    expect(reviewed.visibility).toBe("editorial_workspace");
    expect(reviewed.publicAccessMode).toBe("none");
    expect(reviewed.roomIsPublic).toBe(false);
    expect(reviewed.approvedForActivationAt).toBeNull();
    expect(reviewed.approvedForActivationBy).toBeNull();
    expect(reviewed.approvedForPublicationAt).toBeNull();
    expect(reviewed.approvedForPublicationBy).toBeNull();
    expect(reviewed.blockers).toContain("activation_not_approved");
    expect(reviewed.blockers).toContain("publication_not_approved");

    const activationWithoutNewApproval = activateAnlassraumAfterReview(
      reviewed,
      {
        actorUserId: "admin-1",
        reason: "Alte Freigabe darf nicht weitergelten.",
        origin: "anlassraum_activation_workflow",
        approvedAt: "2026-07-01T09:16:00.000Z",
      },
    );
    const publicationWithoutNewApproval = publishAnlassraumAfterReview(
      reviewed,
      {
        actorUserId: "admin-1",
        reason: "Alte Freigabe darf nicht weitergelten.",
        origin: "anlassraum_activation_workflow",
        approvedAt: "2026-07-01T09:16:00.000Z",
      },
    );
    expect(activationWithoutNewApproval.ok).toBe(false);
    expect(publicationWithoutNewApproval.ok).toBe(false);

    let persistedRecord = record;
    let persistedAudit:
      | {
          action: string;
          questionGuardActorExtractionSource: string;
          questionGuardEvidenceRefs: string[];
        }
      | null = null;
    const auditEntry = {
      action: "question_guard_reviewed",
      questionGuardActorExtractionSource: "actor_graph",
      questionGuardEvidenceRefs: [
        "actor-graph:anlassraum-question-guard-1",
      ],
    };

    await expect(
      persistQuestionGuardReviewFailClosed({
        reviewedRecord: reviewed,
        auditEntry,
        persistAudit: async () => {
          throw new Error("simulated_audit_persistence_failure");
        },
        persistRecord: async (nextRecord) => {
          persistedRecord = nextRecord;
        },
      }),
    ).rejects.toThrow("simulated_audit_persistence_failure");
    expect(persistedRecord.questionGuard.releaseState).toBe("review_required");
    expect(persistedRecord.approvedForActivationAt).toBe(
      "2026-07-01T09:05:00.000Z",
    );

    await persistQuestionGuardReviewFailClosed({
      reviewedRecord: reviewed,
      auditEntry,
      persistAudit: async (entry) => {
        persistedAudit = entry;
      },
      persistRecord: async (nextRecord) => {
        persistedRecord = nextRecord;
      },
    });
    expect(persistedRecord.questionGuard.releaseState).toBe("draft_allowed");
    expect(persistedAudit).toEqual(auditEntry);

    const approved = approveAnlassraumActivation(persistedRecord, {
      actorUserId: "admin-1",
      reason: "Aktivierung nach Guard-Review freigegeben.",
      origin: "admin_review",
      approvedAt: "2026-07-01T09:20:00.000Z",
    });
    const activated = activateAnlassraumAfterReview(approved, {
      actorUserId: "admin-1",
      reason: "Intern aktivieren.",
      origin: "anlassraum_activation_workflow",
      approvedAt: "2026-07-01T09:30:00.000Z",
    });

    expect(activated.ok).toBe(true);
    if (!activated.ok) return;
    expect(activated.record.status).toBe("activated");
    expect(activated.record.visibility).toBe("active_internal");
    expect(activated.record.roomIsPublic).toBe(false);

    const approvedPublication = approveAnlassraumPublication(
      activated.record,
      {
        actorUserId: "admin-1",
        reason: "Veröffentlichung nach Guard-Review separat freigegeben.",
        origin: "admin_review",
        approvedAt: "2026-07-01T09:40:00.000Z",
      },
    );
    const published = publishAnlassraumAfterReview(approvedPublication, {
      actorUserId: "admin-1",
      reason: "Explizit veröffentlichen.",
      origin: "anlassraum_activation_workflow",
      approvedAt: "2026-07-01T09:50:00.000Z",
    });
    expect(published.ok).toBe(true);
  });

  it("keeps created anlassraeume non-public until explicit publication", () => {
    const record = buildActivationRecord();

    expect(record.status).toBe("draft");
    expect(record.visibility).toBe("editorial_workspace");
    expect(record.roomIsPublic).toBe(false);
    expect(blocksAnlassraumAutoPublish(record)).toBe(true);
    expect(blocksUnsafeAnlassraumPublicVisibility(record)).toBe(false);
    expect(record.blockers).toContain("activation_not_approved");
    expect(record.blockers).toContain("publication_not_approved");
  });

  it("keeps approved activation and active_internal separate from public visibility", () => {
    const approved = approveAnlassraumActivation(buildActivationRecord(), {
      actorUserId: "admin-1",
      reason: "Aktivierung freigegeben.",
      origin: "admin_review",
      approvedAt: "2026-07-01T09:20:00.000Z",
    });

    expect(approved.status).toBe("approved_for_activation");
    expect(approved.visibility).toBe("editorial_workspace");
    expect(approved.roomIsPublic).toBe(false);

    const activated = activateAnlassraumAfterReview(approved, {
      actorUserId: "admin-1",
      reason: "Intern aktivieren.",
      origin: "anlassraum_activation_workflow",
      approvedAt: "2026-07-01T09:30:00.000Z",
    });

    expect(activated.ok).toBe(true);
    if (activated.ok) {
      expect(activated.record.status).toBe("activated");
      expect(activated.record.visibility).toBe("active_internal");
      expect(activated.record.roomStatus).toBe("active");
      expect(activated.record.roomIsPublic).toBe(false);
      expect(blocksAnlassraumAutoActivation(activated.record)).toBe(false);
      expect(blocksUnsafeAnlassraumPublicVisibility(activated.record)).toBe(
        false,
      );
    }
  });

  it("requires activation before publication approval and publication before public visibility", () => {
    const draft = buildActivationRecord();
    expect(canApproveAnlassraumPublication(draft)).toBe(false);
    expect(canPublishAnlassraum(draft)).toBe(false);

    const approvedActivation = approveAnlassraumActivation(draft, {
      actorUserId: "admin-1",
      reason: "Aktivierung freigegeben.",
      origin: "admin_review",
      approvedAt: "2026-07-01T09:20:00.000Z",
    });
    const activated = activateAnlassraumAfterReview(approvedActivation, {
      actorUserId: "admin-1",
      reason: "Intern aktivieren.",
      origin: "anlassraum_activation_workflow",
      approvedAt: "2026-07-01T09:30:00.000Z",
    });

    expect(activated.ok).toBe(true);
    if (!activated.ok) return;

    const approvedPublication = approveAnlassraumPublication(
      activated.record,
      {
        actorUserId: "admin-1",
        reason: "Veröffentlichung freigegeben.",
        origin: "admin_review",
        approvedAt: "2026-07-01T09:40:00.000Z",
      },
    );

    expect(approvedPublication.status).toBe("approved_for_publication");
    expect(approvedPublication.visibility).toBe(
      "ready_for_publication_review",
    );
    expect(approvedPublication.roomIsPublic).toBe(false);
    expect(canPublishAnlassraum(approvedPublication)).toBe(true);

    const published = publishAnlassraumAfterReview(approvedPublication, {
      actorUserId: "admin-1",
      reason: "Öffentlich sichtbar machen.",
      origin: "anlassraum_activation_workflow",
      approvedAt: "2026-07-01T09:50:00.000Z",
    });

    expect(published.ok).toBe(true);
    if (published.ok) {
      expect(published.record.status).toBe("published");
      expect(published.record.visibility).toBe("public");
      expect(published.record.publicAccessMode).toBe("public_read_only");
      expect(published.record.roomStatus).toBe("active");
      expect(published.record.roomIsPublic).toBe(true);
    }
  });

  it("blocks publication while review signals are unresolved and keeps guardrails explicit", () => {
    const blocked = buildActivationRecord({
      moderationPending: true,
      unresolvedTrustQualityBlocker: true,
    });

    const approvedActivation = approveAnlassraumActivation(blocked, {
      actorUserId: "admin-1",
      reason: "Trotzdem prüfen.",
      origin: "admin_review",
      approvedAt: "2026-07-01T09:20:00.000Z",
    });

    expect(approvedActivation.status).toBe("blocked");
    expect(approvedActivation.blockers).toContain("moderation_pending");
    expect(approvedActivation.blockers).toContain(
      "unresolved_trust_quality_blocker",
    );
    expect(approvedActivation.guardrails.noAutoGraphWrite).toBe(true);
    expect(approvedActivation.guardrails.noAutoMerge).toBe(true);
    expect(approvedActivation.guardrails.noAutoFactcheck).toBe(true);
    expect(approvedActivation.guardrails.noDeepSearch).toBe(true);
  });
});
