import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPublishedAnlassraumActivationRecords: vi.fn(),
}));

vi.mock("@/features/create/anlassraumActivationWorkflowServer", () => ({
  listPublishedAnlassraumActivationRecords: (...args: unknown[]) =>
    mocks.listPublishedAnlassraumActivationRecords(...args),
}));

import {
  getPublishedAnlassraumBySlugOrId,
  listPublishedAnlassraeume,
  mapAnlassraumToPublicAnlassraum,
} from "@features/anlassraum/publicRuntime";
import type { AnlassraumActivationRecord } from "@/features/create/anlassraumActivationWorkflow";

function buildRecord(
  overrides: Partial<AnlassraumActivationRecord> = {},
): AnlassraumActivationRecord {
  return {
    id: "anlassraum-activation:handoff-1",
    sourceHandoffId: "handoff-1",
    sourceReviewItemId: "create_handoff:persisted:handoff-1",
    statementId: "create-handoff:handoff-1",
    anlassraumId: "65a111111111111111111110",
    anlassraumSlug: "sichere-schulwege",
    runtimeStatus: "created",
    runtimeVisibility: "published",
    roomStatus: "active",
    roomIsPublic: true,
    title: "Anlassraum Sichere Schulwege",
    workingTitle: "Anlassraum Sichere Schulwege",
    trigger: "Welche Kreuzungen sind zuerst kritisch?",
    description: "Öffentliche Runtime-Beschreibung für sichere Schulwege.",
    relatedDossierId: "dossier-sichere-schulwege",
    recognizedStandpoints: ["Pro: Kinder brauchen sichere Wege."],
    argumentLines: ["Querungen priorisieren."],
    openQuestions: ["Welche Schulen sind besonders betroffen?"],
    sourceStatus: "source_reviewed",
    communitySignals: [
      {
        contributionId: "contribution-1",
        title: "Interner Community-Hinweis",
        status: "accepted_as_hint",
        kind: "source_suggestion",
        summary: "Nicht öffentlich anzeigen",
        trustLevel: "medium",
        sourceQualityLevel: "medium",
        reviewPriority: "high",
        moderationStatus: "accepted",
        hasAbuseBlocker: false,
        hasTrustQualityBlocker: false,
        sourceReviewPending: false,
        moderationPending: false,
      },
    ],
    graphReferences: ["topic-graph-1"],
    topicReferences: ["Sichere Schulwege"],
    moderationPending: false,
    unresolvedAbuseSignal: false,
    unresolvedTrustQualityBlocker: false,
    graphContextPending: false,
    dossierContextPending: false,
    creationAudited: true,
    status: "published",
    visibility: "public",
    publicAccessMode: "public_read_only",
    blockers: [],
    auditContext: {
      actorUserId: "admin-1",
      reason: "Explizit veröffentlicht.",
      origin: "admin_review",
      approvedAt: "2026-07-01T09:10:00.000Z",
    },
    guardrails: {
      createdNotPublic: true,
      approvedForCreationNotPublic: true,
      activeInternalNotPublic: true,
      approvedForActivationNotPublic: true,
      approvedForPublicationNotPublicUntilPublish: true,
      noAutoPublishFromCreation: true,
      noAutoActivationFromCreation: true,
      noPublicVisibilitySideEffect: true,
      noVerifiedFactsByDefault: true,
      noVerifiedSourcesByDefault: true,
      noCommunityHintsAsTruth: true,
      noTrustOrSourceQualityAsVerification: true,
      noGraphEdgeAsProof: true,
      noDossierContextAsProof: true,
      noMajorityAsTruth: true,
      noAutoGraphWrite: true,
      noAutoMerge: true,
      noAutoFactcheck: true,
      noAutoDossierCreation: true,
      noAutoParticipationSpaceCreation: true,
      noDeepSearch: true,
      auditContextRequired: true,
    },
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T09:50:00.000Z",
    auditTrail: [],
    approvedForActivationAt: "2026-07-01T09:20:00.000Z",
    approvedForActivationBy: "admin-1",
    approvedForPublicationAt: "2026-07-01T09:40:00.000Z",
    approvedForPublicationBy: "admin-1",
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

describe("anlassraum public route runtime", () => {
  it("lists only published public runtime anlassraeume and strips internals", async () => {
    mocks.listPublishedAnlassraumActivationRecords.mockResolvedValue([
      buildRecord(),
    ]);

    const result = await listPublishedAnlassraeume({ limit: 20 });
    const detail = mapAnlassraumToPublicAnlassraum(buildRecord());

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      slug: "sichere-schulwege",
      title: "Anlassraum Sichere Schulwege",
      source: "runtime",
    });
    expect(JSON.stringify(detail)).not.toContain("communitySignals");
    expect(JSON.stringify(detail)).not.toContain("auditTrail");
    expect(JSON.stringify(detail)).not.toContain("trustLevel");
    expect(JSON.stringify(detail)).not.toContain("graphReferences");
  });

  it("resolves published runtime anlassraeume by slug or id", async () => {
    mocks.listPublishedAnlassraumActivationRecords.mockResolvedValue([
      buildRecord(),
    ]);

    const bySlug = await getPublishedAnlassraumBySlugOrId("sichere-schulwege");
    const byId = await getPublishedAnlassraumBySlugOrId(
      "65a111111111111111111110",
    );

    expect(bySlug?.slug).toBe("sichere-schulwege");
    expect(byId?.id).toBe("65a111111111111111111110");
    expect(JSON.stringify(bySlug)).not.toContain("admin-1");
  });
});
