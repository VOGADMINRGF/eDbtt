import { describe, expect, it } from "vitest";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  buildParticipationSpaceRuntimeDraftFromAnlassraum,
  buildParticipationSpaceRuntimeDraftFromDossier,
  buildParticipationSpaceRuntimeDraftFromHandoff,
  blocksParticipationSpaceAutoActivation,
  blocksParticipationSpaceAutoPublish,
  blocksParticipationSpacePublicVisibility,
  blocksUnsafeParticipationSpaceCreation,
  createParticipationSpaceRuntimeAfterReview,
  getParticipationSpaceRuntimeCreationBlockers,
  type ParticipationSpaceRuntimeRecord,
} from "@/features/create/participationSpaceRuntime";
import type { PersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";

function buildHandoffRecord(): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "handoff-participation-1",
    source: "create",
    sourceText: "Vor Schulen fehlen sichere Querungen und der Kiez braucht eine sichtbare Beteiligungsfrage.",
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
    resumeHref: "/create?resume=handoff-participation-1",
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

function toRecord(
  overrides: Partial<ParticipationSpaceRuntimeRecord> = {},
): ParticipationSpaceRuntimeRecord {
  const draft = buildParticipationSpaceRuntimeDraftFromHandoff(
    buildHandoffRecord(),
    {
      status: "approved_for_creation",
      auditContext: {
        actorUserId: "admin-1",
        reason: "Review-approved creation.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
    },
  );

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

describe("participation space runtime creation", () => {
  it("builds a runtime draft from an existing handoff", () => {
    const draft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
    );

    expect(draft.title).toContain("Sichere Schulwege");
    expect(draft.description).toContain("Aussagen");
    expect(draft.participationQuestion).toContain("Welche Kreuzungen");
    expect(draft.recognizedStandpoints[0]).toContain("Pro:");
    expect(draft.openQuestions).toContain(
      "Welche Schulen sind besonders betroffen?",
    );
    expect(draft.relatedDossierId).toBe("dossier-sichere-schulwege");
    expect(draft.relatedAnlassraumId).toBe("65a111111111111111111110");
  });

  it("uses anlassraum and dossier context without treating either as proof", () => {
    const anlassraumDraft = buildParticipationSpaceRuntimeDraftFromAnlassraum({
      anlassraumId: "65a111111111111111111110",
      title: "Beteiligungsraum Sichere Schulwege",
      trigger: "Wie priorisieren wir sichere Querungen?",
      description: "Kontext aus dem bestehenden Anlassraum.",
      topicReferences: ["Sichere Schulwege"],
    });
    const dossierDraft = buildParticipationSpaceRuntimeDraftFromDossier({
      dossierId: "dossier-1",
      title: "Beteiligungsraum Sichere Schulwege",
      summary: "Kontext aus dem bestehenden Dossier.",
      originQuestion: "Welche Maßnahmen sind zuerst nötig?",
      topicReferences: ["Sichere Schulwege"],
    });

    expect(anlassraumDraft.relatedAnlassraumId).toBe(
      "65a111111111111111111110",
    );
    expect(dossierDraft.relatedDossierId).toBe("dossier-1");
    expect(anlassraumDraft.guardrails.noAnlassraumContextAsProof).toBe(true);
    expect(dossierDraft.guardrails.noDossierContextAsProof).toBe(true);
    expect(blocksUnsafeParticipationSpaceCreation(anlassraumDraft)).toBe(false);
    expect(blocksUnsafeParticipationSpaceCreation(dossierDraft)).toBe(false);
  });

  it("blocks creation while review is not explicitly approved", () => {
    const draft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        auditContext: {
          actorUserId: "admin-1",
          reason: "Prüfkontext vorhanden.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );

    expect(getParticipationSpaceRuntimeCreationBlockers(draft)).toContain(
      "review_not_approved",
    );
    expect(draft.approvedForSetup).toBe(true);
  });

  it("requires approved_for_creation beyond approved_for_setup", () => {
    const draft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        status: "queued_for_review",
        approvedForSetup: true,
        auditContext: {
          actorUserId: "admin-1",
          reason: "Setup allein reicht nicht.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );

    expect(draft.approvedForSetup).toBe(true);
    expect(getParticipationSpaceRuntimeCreationBlockers(draft)).toContain(
      "review_not_approved",
    );
  });

  it("allows creation with approved_for_creation plus audit context", async () => {
    const record = toRecord();

    const result = await createParticipationSpaceRuntimeAfterReview(record, {
      creator: async () => ({
        ok: true,
        participationSpaceId: "participation-space-1",
        participationSpaceSlug: "sichere-schulwege",
        createdAt: "2026-06-30T10:00:00.000Z",
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.status).toBe("created");
      expect(result.record.visibility).toBe("active_internal");
      expect(result.record.createdParticipationSpaceId).toBe(
        "participation-space-1",
      );
      expect(result.record.createdParticipationSpaceSlug).toBe(
        "sichere-schulwege",
      );
      expect(result.record.visibility).not.toBe("public");
      expect(blocksParticipationSpacePublicVisibility(result.record)).toBe(false);
    }
  });

  it("blocks source-review-pending, moderation, abuse and trust-quality blocker states", () => {
    const pendingSource = createCommunitySourceReviewContributionDraft({
      kind: "source_suggestion",
      target: "handoff_review_item",
      targetId: "handoff-participation-1",
      text: "Siehe Verkehrszählung.",
      sourceRefs: ["https://example.org/verkehr"],
      status: "submitted",
    });
    const moderationPending = createCommunitySourceReviewContributionDraft({
      kind: "context_note",
      target: "handoff_review_item",
      targetId: "handoff-participation-1",
      text: "Bitte zuerst moderieren.",
      status: "needs_moderation",
    });
    const abuseBlocked = {
      ...createCommunitySourceReviewContributionDraft({
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "handoff-participation-1",
        text: "Spamverdacht.",
      }),
      moderation: {
        ...createCommunitySourceReviewContributionDraft({
          kind: "context_note",
          target: "handoff_review_item",
          targetId: "handoff-participation-1",
          text: "Spamverdacht.",
        }).moderation,
        abuseState: {
          ...createCommunitySourceReviewContributionDraft({
            kind: "context_note",
            target: "handoff_review_item",
            targetId: "handoff-participation-1",
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
        targetId: "handoff-participation-1",
        text: "Quellenqualität unklar.",
        sourceRefs: ["https://example.org/quelle"],
      }),
      moderation: {
        ...createCommunitySourceReviewContributionDraft({
          kind: "source_suggestion",
          target: "handoff_review_item",
          targetId: "handoff-participation-1",
          text: "Quellenqualität unklar.",
          sourceRefs: ["https://example.org/quelle"],
        }).moderation,
        trustState: {
          ...createCommunitySourceReviewContributionDraft({
            kind: "source_suggestion",
            target: "handoff_review_item",
            targetId: "handoff-participation-1",
            text: "Quellenqualität unklar.",
            sourceRefs: ["https://example.org/quelle"],
          }).moderation.trustState,
          reviewBlocked: true,
        },
      },
    };

    const sourceDraft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        status: "approved_for_creation",
        communityContributions: [pendingSource],
        auditContext: {
          actorUserId: "admin-1",
          reason: "Quellen noch offen.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );
    const moderationDraft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        status: "approved_for_creation",
        communityContributions: [moderationPending],
        auditContext: {
          actorUserId: "admin-1",
          reason: "Moderation noch offen.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );
    const abuseDraft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        status: "approved_for_creation",
        communityContributions: [abuseBlocked as any],
        auditContext: {
          actorUserId: "admin-1",
          reason: "Abuse noch offen.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );
    const trustDraft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        status: "approved_for_creation",
        communityContributions: [trustBlocked as any],
        auditContext: {
          actorUserId: "admin-1",
          reason: "Trust noch offen.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );

    expect(getParticipationSpaceRuntimeCreationBlockers(sourceDraft)).toContain(
      "source_review_pending",
    );
    expect(
      getParticipationSpaceRuntimeCreationBlockers(moderationDraft),
    ).toContain("moderation_pending");
    expect(getParticipationSpaceRuntimeCreationBlockers(abuseDraft)).toContain(
      "unresolved_abuse_signal",
    );
    expect(getParticipationSpaceRuntimeCreationBlockers(trustDraft)).toContain(
      "unresolved_trust_quality_blocker",
    );
  });

  it("can block graph, dossier and anlassraum context gaps when required", () => {
    const draft = buildParticipationSpaceRuntimeDraftFromHandoff(
      buildHandoffRecord(),
      {
        status: "approved_for_creation",
        graphContextPending: true,
        dossierContextPending: true,
        anlassraumContextPending: true,
        auditContext: {
          actorUserId: "admin-1",
          reason: "Kontexte fehlen noch.",
          origin: "admin_review",
          approvedAt: "2026-06-30T09:00:00.000Z",
        },
      },
    );

    expect(getParticipationSpaceRuntimeCreationBlockers(draft)).toContain(
      "graph_context_pending",
    );
    expect(getParticipationSpaceRuntimeCreationBlockers(draft)).toContain(
      "dossier_context_pending",
    );
    expect(getParticipationSpaceRuntimeCreationBlockers(draft)).toContain(
      "anlassraum_context_pending",
    );
  });

  it("keeps creation separate from publish, activation and public visibility", () => {
    const created = toRecord({ status: "created", visibility: "active_internal" });
    const publicationReview = toRecord({
      visibility: "ready_for_publication_review",
    });

    expect(created.visibility).toBe("active_internal");
    expect(created.visibility).not.toBe("public");
    expect(publicationReview.visibility).toBe("ready_for_publication_review");
    expect(publicationReview.visibility).not.toBe("public");
    expect(blocksParticipationSpaceAutoPublish(created)).toBe(false);
    expect(blocksParticipationSpaceAutoActivation(created)).toBe(false);
    expect(blocksParticipationSpacePublicVisibility(created)).toBe(false);
    expect(blocksParticipationSpacePublicVisibility(publicationReview)).toBe(
      false,
    );
    expect(created.guardrails.noCommunityHintsAsTruth).toBe(true);
    expect(created.guardrails.noTrustOrSourceQualityAsVerification).toBe(true);
    expect(created.guardrails.noGraphEdgeAsProof).toBe(true);
    expect(created.guardrails.noDossierContextAsProof).toBe(true);
    expect(created.guardrails.noAnlassraumContextAsProof).toBe(true);
    expect(created.guardrails.noAutoGraphWrite).toBe(true);
    expect(created.guardrails.noAutoMerge).toBe(true);
  });
});
