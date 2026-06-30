import { describe, expect, it } from "vitest";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  buildDossierRuntimeDraftFromHandoff,
  createDossierRuntimeAfterReview,
  getDossierRuntimeCreationBlockers,
  type DossierRuntimeRecord,
} from "@/features/create/dossierRuntime";
import type { PersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";

function buildHandoffRecord(): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "handoff-dossier-1",
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
    resumeHref: "/create?resume=handoff-dossier-1",
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

function toRecord(
  overrides: Partial<DossierRuntimeRecord> = {},
): DossierRuntimeRecord {
  const draft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
    status: "approved_for_creation",
    auditContext: {
      actorUserId: "admin-1",
      reason: "Review-approved creation.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:00:00.000Z",
    },
  });

  return {
    ...draft,
    auditTrail: [],
    approvedForCreationAt: "2026-06-30T09:00:00.000Z",
    approvedForCreationBy: "admin-1",
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

describe("dossier runtime creation", () => {
  it("builds a dossier runtime draft from an existing handoff", () => {
    const draft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord());

    expect(draft.title).toContain("Sichere Schulwege");
    expect(draft.summary).toContain("Aussagen");
    expect(draft.originQuestion).toContain("Welche Kreuzungen");
    expect(draft.recognizedStandpoints[0]).toContain("Pro:");
    expect(draft.openQuestions).toContain("Welche Schulen sind besonders betroffen?");
  });

  it("blocks creation while review is not explicitly approved", () => {
    const draft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      auditContext: {
        actorUserId: "admin-1",
        reason: "Prüfkontext vorhanden.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(getDossierRuntimeCreationBlockers(draft)).toContain("review_not_approved");
    expect(draft.approvedForSetup).toBe(true);
  });

  it("requires approved_for_creation beyond approved_for_setup", () => {
    const draft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "queued_for_review",
      approvedForSetup: true,
      auditContext: {
        actorUserId: "admin-1",
        reason: "Setup allein reicht nicht.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(draft.approvedForSetup).toBe(true);
    expect(getDossierRuntimeCreationBlockers(draft)).toContain("review_not_approved");
  });

  it("allows creation with approved_for_creation plus audit context", async () => {
    const record = toRecord();

    const result = await createDossierRuntimeAfterReview(record, {
      creator: async () => ({
        ok: true,
        dossierId: "create-handoff:abc123",
        workspaceId: "studio-workspace-1",
        createdAt: "2026-06-30T10:00:00.000Z",
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.status).toBe("created");
      expect(result.record.visibility).toBe("editorial_workspace");
      expect(result.record.createdDossierId).toBe("create-handoff:abc123");
      expect(result.record.createdWorkspaceId).toBe("studio-workspace-1");
    }
  });

  it("blocks source-review-pending, moderation, abuse and trust-quality blocker states", () => {
    const pendingSource = createCommunitySourceReviewContributionDraft({
      kind: "source_suggestion",
      target: "handoff_review_item",
      targetId: "handoff-dossier-1",
      text: "Siehe Verkehrszählung.",
      sourceRefs: ["https://example.org/verkehr"],
      status: "submitted",
    });
    const moderationPending = createCommunitySourceReviewContributionDraft({
      kind: "context_note",
      target: "handoff_review_item",
      targetId: "handoff-dossier-1",
      text: "Bitte zuerst moderieren.",
      status: "needs_moderation",
    });
    const abuseBlocked = {
      ...createCommunitySourceReviewContributionDraft({
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "handoff-dossier-1",
        text: "Spamverdacht.",
      }),
      moderation: {
        ...createCommunitySourceReviewContributionDraft({
          kind: "context_note",
          target: "handoff_review_item",
          targetId: "handoff-dossier-1",
          text: "Spamverdacht.",
        }).moderation,
        abuseState: {
          ...createCommunitySourceReviewContributionDraft({
            kind: "context_note",
            target: "handoff_review_item",
            targetId: "handoff-dossier-1",
            text: "Spamverdacht.",
          }).moderation.abuseState,
          reviewBlocked: true,
        },
      },
    };
    const trustBlocked = {
      ...createCommunitySourceReviewContributionDraft({
        kind: "source_suggestion",
        target: "handoff_review_item",
        targetId: "handoff-dossier-1",
        text: "Quellenqualität unklar.",
        sourceRefs: ["https://example.org/quelle"],
      }),
      moderation: {
        ...createCommunitySourceReviewContributionDraft({
          kind: "source_suggestion",
          target: "handoff_review_item",
          targetId: "handoff-dossier-1",
          text: "Quellenqualität unklar.",
          sourceRefs: ["https://example.org/quelle"],
        }).moderation,
        trustState: {
          ...createCommunitySourceReviewContributionDraft({
            kind: "source_suggestion",
            target: "handoff_review_item",
            targetId: "handoff-dossier-1",
            text: "Quellenqualität unklar.",
            sourceRefs: ["https://example.org/quelle"],
          }).moderation.trustState,
          reviewBlocked: true,
        },
      },
    };

    const sourceDraft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [pendingSource],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Quellen noch offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    const moderationDraft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [moderationPending],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Moderation noch offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    const abuseDraft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [abuseBlocked as any],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Abuse offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    const trustDraft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [trustBlocked as any],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Trust-Blocker offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(getDossierRuntimeCreationBlockers(sourceDraft)).toContain("source_review_pending");
    expect(getDossierRuntimeCreationBlockers(moderationDraft)).toContain("moderation_pending");
    expect(getDossierRuntimeCreationBlockers(abuseDraft)).toContain("unresolved_abuse_signal");
    expect(getDossierRuntimeCreationBlockers(trustDraft)).toContain(
      "unresolved_trust_quality_blocker",
    );
  });

  it("keeps creation separate from publish, truth, source verification and downstream spaces", () => {
    const draft = buildDossierRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      auditContext: {
        actorUserId: "admin-1",
        reason: "Freigabe liegt vor.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(draft.visibility).not.toBe("published");
    expect(draft.guardrails.noAutoPublish).toBe(true);
    expect(draft.guardrails.noVerifiedFactsByDefault).toBe(true);
    expect(draft.guardrails.noVerifiedSourcesByDefault).toBe(true);
    expect(draft.guardrails.noCommunityHintsAsTruth).toBe(true);
    expect(draft.guardrails.noTrustOrSourceQualityAsVerification).toBe(true);
    expect(draft.guardrails.noGraphEdgeAsProof).toBe(true);
    expect(draft.guardrails.noAnlassraumCreation).toBe(true);
    expect(draft.guardrails.noParticipationSpaceCreation).toBe(true);
  });
});
