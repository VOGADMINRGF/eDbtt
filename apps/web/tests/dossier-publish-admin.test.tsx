import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DossierPublicationRecord } from "@/features/create/dossierPublishWorkflow";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import AdminDossierPublishSection from "@/app/admin/review/AdminDossierPublishSection";
import DossierPublishActions from "@/app/admin/review/DossierPublishActions";

function buildRecord(
  overrides: Partial<DossierPublicationRecord> = {},
): DossierPublicationRecord {
  return {
    id: "dossier-publication:handoff-1",
    sourceHandoffId: "handoff-1",
    sourceReviewItemId: "create_handoff:persisted:handoff-1",
    statementId: "create-handoff:handoff-1",
    dossierId: "dossier-sichere-schulwege",
    runtimeStatus: "created",
    runtimeVisibility: "editorial_workspace",
    title: "Dossier Sichere Schulwege",
    workingTitle: "Dossier Sichere Schulwege",
    summary:
      "1 Aussage · 1 offene Frage. Sichere Schulwege sollen strukturiert öffentlich erklärt werden.",
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
    status: "review_only",
    visibility: "internal",
    publicAccessMode: "none",
    blockers: ["publication_review_not_requested", "publication_not_approved"],
    auditContext: {
      actorUserId: "admin-1",
      reason: "Audit vorhanden.",
      origin: "admin_review",
      approvedAt: "2026-06-30T09:10:00.000Z",
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
    updatedAt: "2026-06-30T09:10:00.000Z",
    auditTrail: [
      {
        id: "audit-1",
        sourceHandoffId: "handoff-1",
        dossierId: "dossier-sichere-schulwege",
        at: "2026-06-30T09:10:00.000Z",
        action: "publication_review_requested",
        actorUserId: "admin-1",
        note: "Veröffentlichungsworkflow abgeleitet.",
        blockers: ["publication_review_not_requested", "publication_not_approved"],
        status: "review_only",
      },
    ],
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

describe("dossier publish admin ui", () => {
  it("renders the publication section with guardrails, actions and audit", () => {
    const reviewOnly = buildRecord();
    const published = buildRecord({
      id: "dossier-publication:handoff-2",
      sourceHandoffId: "handoff-2",
      status: "published",
      visibility: "public",
      publicAccessMode: "public_read_only",
      blockers: [],
      auditTrail: [
        {
          id: "audit-2",
          sourceHandoffId: "handoff-2",
          dossierId: "dossier-sichere-schulwege",
          at: "2026-06-30T09:50:00.000Z",
          action: "published_public",
          actorUserId: "admin-1",
          note: "Explizit veröffentlicht.",
          blockers: [],
          status: "published",
        },
      ],
    });

    const markup = renderToStaticMarkup(
      <AdminDossierPublishSection
        dossierPublicationRecords={[reviewOnly, published]}
        dossierPublicationAuditMap={new Map([
          [reviewOnly.sourceHandoffId, reviewOnly.auditTrail],
          [published.sourceHandoffId, published.auditTrail],
        ])}
        dossierPublicationPersistence={{
          label: "Persistenter Dossier-Publish-Workflow",
          summary: "Veröffentlichungsfreigaben und Audit-Spuren liegen dauerhaft vor.",
          productionTruth: true,
          publicRouteRuntime: "runtime_wired",
        }}
      />,
    );

    expect(markup).toContain("Dossier-Veröffentlichung prüfen");
    expect(markup).toContain("Veröffentlichungsprüfung anfordern");
    expect(markup).toContain("Freigabe bedeutet Veröffentlichung, nicht Wahrheitszertifikat.");
    expect(markup).toContain("Quellen bleiben prüfbare Belege/Kontext");
    expect(markup).toContain("Dossier-Veröffentlichung erzeugt keinen Graph Merge");
    expect(markup).toContain("Audit Trail");
    expect(markup).toContain("runtime_wired");
  });

  it("enables publish only after explicit publication approval", () => {
    const reviewOnlyMarkup = renderToStaticMarkup(
      <DossierPublishActions record={buildRecord()} />,
    );
    const approvedMarkup = renderToStaticMarkup(
      <DossierPublishActions
        record={buildRecord({
          sourceHandoffId: "handoff-2",
          status: "approved_for_publication",
          blockers: [],
        })}
      />,
    );

    expect(reviewOnlyMarkup).toContain(
      'data-testid="publish-dossier-handoff-1" disabled=""',
    );
    expect(approvedMarkup).toContain('data-testid="publish-dossier-handoff-2"');
    expect(approvedMarkup).not.toContain(
      'data-testid="publish-dossier-handoff-2" disabled=""',
    );
  });
});
