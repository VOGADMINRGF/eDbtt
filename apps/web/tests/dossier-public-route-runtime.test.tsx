import { describe, expect, it } from "vitest";
import {
  mapDossierToPublicDossier,
} from "@/features/dossier/publicRuntime";
import type { DossierPublicationRecord } from "@/features/create/dossierPublishWorkflow";
import type {
  DossierClaimDoc,
  DossierDoc,
  DossierFindingDoc,
  DossierSourceDoc,
  OpenQuestionDoc,
} from "@features/dossier";

function buildPublicationRecord(
  overrides: Partial<DossierPublicationRecord> = {},
): DossierPublicationRecord {
  return {
    id: "dossier-publication:handoff-1",
    sourceHandoffId: "handoff-1",
    sourceReviewItemId: "create_handoff:persisted:handoff-1",
    statementId: "create-handoff:handoff-1",
    dossierId: "dossier-sichere-schulwege",
    runtimeStatus: "created",
    runtimeVisibility: "published",
    title: "Dossier Sichere Schulwege",
    workingTitle: "Dossier Sichere Schulwege",
    summary: "Sichere Schulwege werden als veröffentlichter Arbeitsstand erklärt.",
    originQuestion: "Welche Kreuzungen sind zuerst kritisch?",
    recognizedStandpoints: ["Pro: Kinder brauchen sichere Wege."],
    argumentLines: ["Kinder brauchen sichere Wege."],
    openQuestions: ["Welche Schulen sind besonders betroffen?"],
    sourceStatus: "source_review_requested",
    communitySignals: [],
    graphReferences: ["Sichere Schulwege"],
    topicReferences: ["Sichere Schulwege"],
    moderationPending: false,
    unresolvedAbuseSignal: false,
    unresolvedTrustQualityBlocker: false,
    graphContextPending: false,
    creationAudited: true,
    status: "published",
    visibility: "public",
    publicAccessMode: "public_read_only",
    blockers: [],
    auditContext: {
      actorUserId: "admin-1",
      reason: "Veröffentlicht.",
      origin: "dossier_publish_workflow",
      approvedAt: "2026-06-30T09:40:00.000Z",
    },
    guardrails: {
      creationApprovalIsNotPublicationApproval: true,
      publicationApprovalIsNotFactVerification: true,
      publishedIsNotAbsoluteTruth: true,
      sourceReferencesAreNotAutomaticVerification: true,
      trustSignalsAreReviewContextOnly: true,
      noAutoPublish: true,
      noAutoActivation: true,
      noAutoGraphWrite: true,
      noAutoMerge: true,
      noAutoFactcheck: true,
      noAutoAnlassraumCreation: true,
      noAutoParticipationSpaceCreation: true,
      noDeepSearch: true,
      noHiddenCostPath: true,
      noInternalFieldLeak: true,
      auditContextRequired: true,
    },
    createdAt: "2026-06-30T08:00:00.000Z",
    updatedAt: "2026-06-30T09:40:00.000Z",
    auditTrail: [],
    approvedForPublicationAt: "2026-06-30T09:30:00.000Z",
    approvedForPublicationBy: "admin-1",
    rejectedAt: null,
    rejectedBy: null,
    unpublishedAt: null,
    unpublishedBy: null,
    archivedAt: null,
    archivedBy: null,
    ...overrides,
  };
}

describe("dossier public route runtime", () => {
  it("maps only published/public/public_read_only dossiers to a public-safe dossier payload", () => {
    const dossier = mapDossierToPublicDossier({
      publication: buildPublicationRecord(),
      dossierDoc: {
        dossierId: "dossier-sichere-schulwege",
        statementId: "create-handoff:handoff-1",
        title: "Dossier Sichere Schulwege",
        status: "active",
        counts: {
          claims: 1,
          sources: 1,
          findings: 1,
          edges: 0,
          openQuestions: 1,
        },
        createdAt: new Date("2026-06-30T08:00:00.000Z"),
        updatedAt: new Date("2026-06-30T09:40:00.000Z"),
      } satisfies DossierDoc,
      claims: [
        {
          claimId: "claim-1",
          dossierId: "dossier-sichere-schulwege",
          text: "Vor Schulen fehlen sichere Querungen.",
          kind: "fact",
          status: "open",
          createdByRole: "admin",
        } satisfies DossierClaimDoc,
      ],
      sources: [
        {
          sourceId: "source-1",
          dossierId: "dossier-sichere-schulwege",
          canonicalUrlHash: "hash-1",
          url: "https://example.org/verkehr",
          title: "Verkehrszählung",
          publisher: "Bezirk",
          type: "official",
        } satisfies DossierSourceDoc,
      ],
      findings: [
        {
          findingId: "finding-1",
          dossierId: "dossier-sichere-schulwege",
          claimId: "claim-1",
          verdict: "supports",
          rationale: ["Quelle stützt den Claim."],
          citations: [{ sourceId: "source-1" }],
          producedBy: "editor",
        } satisfies DossierFindingDoc,
      ],
      openQuestions: [
        {
          questionId: "question-1",
          dossierId: "dossier-sichere-schulwege",
          text: "Welche Schulen sind besonders betroffen?",
          status: "open",
        } satisfies OpenQuestionDoc,
      ],
    });

    expect(dossier.meta.status).toBe("published");
    expect(dossier.meta.title).toBe("Dossier Sichere Schulwege");
    expect(dossier.analyze.claims[0]?.text).toContain("Querungen");
    expect(dossier.analyze.questions[0]?.text).toContain("Schulen");
    expect(dossier.analyze.notes.map((entry) => entry.text).join(" ")).toContain(
      "nicht Wahrheitszertifikat",
    );
    expect(JSON.stringify(dossier)).not.toContain("auditTrail");
    expect(JSON.stringify(dossier)).not.toContain("admin-1");
    expect(JSON.stringify(dossier)).not.toContain("trust");
    expect(JSON.stringify(dossier)).not.toContain("moderation");
  });
});
