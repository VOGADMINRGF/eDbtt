import { describe, expect, it } from "vitest";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  buildAnlassraumRuntimeDraftFromDossier,
  buildAnlassraumRuntimeDraftFromHandoff,
  blocksAnlassraumAutoPublish,
  blocksParticipationSpaceSideEffect,
  blocksUnsafeAnlassraumCreation,
  createAnlassraumRuntimeAfterReview,
  getAnlassraumRuntimeCreationBlockers,
  type AnlassraumRuntimeRecord,
} from "@/features/create/anlassraumRuntime";
import type { PersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";

function buildHandoffRecord(): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "handoff-anlassraum-1",
    source: "create",
    sourceText: "Vor Schulen fehlen sichere Querungen und klare Temporegeln.",
    plannerResult: {
      shortSummary: "Sichere Schulwege sollen als Anlassraum strukturiert weitergeführt werden.",
      openQuestion: "Welche Kreuzungen sind zuerst kritisch?",
      openQuestions: ["Welche Kreuzungen sind zuerst kritisch?"],
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
    resumeHref: "/create?resume=handoff-anlassraum-1",
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
    createdAt: "2026-06-30T08:00:00.000Z",
    updatedAt: "2026-06-30T08:00:00.000Z",
  };
}

function toRecord(
  overrides: Partial<AnlassraumRuntimeRecord> = {},
): AnlassraumRuntimeRecord {
  const draft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
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

describe("anlassraum runtime creation", () => {
  it("builds an anlassraum runtime draft from an existing handoff", () => {
    const draft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord());

    expect(draft.title).toContain("Sichere Schulwege");
    expect(draft.description).toContain("Aussagen");
    expect(draft.trigger).toContain("Welche Kreuzungen");
    expect(draft.recognizedStandpoints[0]).toContain("Pro:");
    expect(draft.openQuestions).toContain("Welche Schulen sind besonders betroffen?");
    expect(draft.relatedDossierId).toBe("dossier-sichere-schulwege");
  });

  it("uses dossier context without treating it as proof", () => {
    const draft = buildAnlassraumRuntimeDraftFromDossier({
      dossierId: "dossier-1",
      title: "Dossier Sichere Schulwege",
      summary: "Kontext für einen internen Anlassraum.",
      originQuestion: "Welche Maßnahmen sind zuerst nötig?",
      topicReferences: ["Sichere Schulwege"],
    });

    expect(draft.relatedDossierId).toBe("dossier-1");
    expect(draft.guardrails.noDossierContextAsProof).toBe(true);
    expect(blocksUnsafeAnlassraumCreation(draft)).toBe(false);
  });

  it("blocks creation while review is not explicitly approved", () => {
    const draft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
      auditContext: {
        actorUserId: "admin-1",
        reason: "Prüfkontext vorhanden.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(getAnlassraumRuntimeCreationBlockers(draft)).toContain("review_not_approved");
    expect(draft.approvedForSetup).toBe(true);
  });

  it("requires approved_for_creation beyond approved_for_setup", () => {
    const draft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
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
    expect(getAnlassraumRuntimeCreationBlockers(draft)).toContain("review_not_approved");
  });

  it("allows creation with approved_for_creation plus audit context", async () => {
    const record = toRecord();

    const result = await createAnlassraumRuntimeAfterReview(record, {
      creator: async () => ({
        ok: true,
        anlassraumId: "65a111111111111111111110",
        entityId: "65a111111111111111111120",
        createdAt: "2026-06-30T10:00:00.000Z",
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.status).toBe("created");
      expect(result.record.visibility).toBe("active_internal");
      expect(result.record.createdAnlassraumId).toBe("65a111111111111111111110");
      expect(result.record.createdEntityId).toBe("65a111111111111111111120");
      expect(result.record.visibility).not.toBe("published");
    }
  });

  it("blocks source-review-pending, moderation, abuse and trust-quality blocker states", () => {
    const pendingSource = createCommunitySourceReviewContributionDraft({
      kind: "source_suggestion",
      target: "handoff_review_item",
      targetId: "handoff-anlassraum-1",
      text: "Siehe Verkehrszählung.",
      sourceRefs: ["https://example.org/verkehr"],
      status: "submitted",
    });
    const moderationPending = createCommunitySourceReviewContributionDraft({
      kind: "context_note",
      target: "handoff_review_item",
      targetId: "handoff-anlassraum-1",
      text: "Bitte zuerst moderieren.",
      status: "needs_moderation",
    });
    const abuseBlocked = {
      ...createCommunitySourceReviewContributionDraft({
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "handoff-anlassraum-1",
        text: "Spamverdacht.",
      }),
      moderation: {
        ...createCommunitySourceReviewContributionDraft({
          kind: "context_note",
          target: "handoff_review_item",
          targetId: "handoff-anlassraum-1",
          text: "Spamverdacht.",
        }).moderation,
        abuseState: {
          ...createCommunitySourceReviewContributionDraft({
            kind: "context_note",
            target: "handoff_review_item",
            targetId: "handoff-anlassraum-1",
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
        targetId: "handoff-anlassraum-1",
        text: "Quellenqualität unklar.",
        sourceRefs: ["https://example.org/quelle"],
      }),
      moderation: {
        ...createCommunitySourceReviewContributionDraft({
          kind: "source_suggestion",
          target: "handoff_review_item",
          targetId: "handoff-anlassraum-1",
          text: "Quellenqualität unklar.",
          sourceRefs: ["https://example.org/quelle"],
        }).moderation,
        trustState: {
          ...createCommunitySourceReviewContributionDraft({
            kind: "source_suggestion",
            target: "handoff_review_item",
            targetId: "handoff-anlassraum-1",
            text: "Quellenqualität unklar.",
            sourceRefs: ["https://example.org/quelle"],
          }).moderation.trustState,
          reviewBlocked: true,
        },
      },
    };

    const sourceDraft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [pendingSource],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Quellen noch offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    const moderationDraft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [moderationPending],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Moderation noch offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    const abuseDraft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [abuseBlocked as any],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Abuse-Signal noch offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    const trustDraft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      communityContributions: [trustBlocked as any],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Trust-Blocker noch offen.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(getAnlassraumRuntimeCreationBlockers(sourceDraft)).toContain("source_review_pending");
    expect(getAnlassraumRuntimeCreationBlockers(moderationDraft)).toContain("moderation_pending");
    expect(getAnlassraumRuntimeCreationBlockers(abuseDraft)).toContain("unresolved_abuse_signal");
    expect(getAnlassraumRuntimeCreationBlockers(trustDraft)).toContain(
      "unresolved_trust_quality_blocker",
    );
    expect(sourceDraft.guardrails.noCommunityHintsAsTruth).toBe(true);
    expect(trustDraft.guardrails.noTrustOrSourceQualityAsVerification).toBe(true);
  });

  it("can block graph and dossier context when required references are missing", () => {
    const draft = buildAnlassraumRuntimeDraftFromHandoff(buildHandoffRecord(), {
      status: "approved_for_creation",
      graphContextPending: true,
      dossierContextPending: true,
      auditContext: {
        actorUserId: "admin-1",
        reason: "Kontext fehlt.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    });

    expect(getAnlassraumRuntimeCreationBlockers(draft)).toContain("graph_context_pending");
    expect(getAnlassraumRuntimeCreationBlockers(draft)).toContain("dossier_context_pending");
    expect(draft.guardrails.noGraphEdgeAsProof).toBe(true);
    expect(draft.guardrails.noDossierContextAsProof).toBe(true);
  });

  it("keeps creation separate from publish and participation side effects", () => {
    const record = toRecord({
      visibility: "active_internal",
    });

    expect(blocksUnsafeAnlassraumCreation(record)).toBe(false);
    expect(blocksAnlassraumAutoPublish(record)).toBe(false);
    expect(blocksParticipationSpaceSideEffect(record)).toBe(false);
    expect(record.guardrails.noAutoGraphWrite).toBe(true);
    expect(record.guardrails.noAutoMerge).toBe(true);
  });
});
