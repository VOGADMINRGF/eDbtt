import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DossierRuntimeRecord } from "@/features/create/dossierRuntime";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import AdminDossierRuntimeCreationSection from "@/app/admin/review/AdminDossierRuntimeCreationSection";
import DossierRuntimeCreationActions from "@/app/admin/review/DossierRuntimeCreationActions";

function buildRecord(
  overrides: Partial<DossierRuntimeRecord> = {},
): DossierRuntimeRecord {
  return {
    id: "dossier-runtime:handoff-1",
    sourceHandoffId: "handoff-1",
    sourceReviewItemId: "create_handoff:persisted:handoff-1",
    statementId: "create-handoff:handoff-1",
    title: "Dossier vorbereiten: Sichere Schulwege",
    workingTitle: "Dossier vorbereiten: Sichere Schulwege",
    summary: "1 Aussagen · 1 offene Fragen. Sichere Schulwege sollen strukturiert geprüft werden.",
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
    approvedForSetup: true,
    status: "queued_for_review",
    visibility: "internal_review",
    blockers: ["review_not_approved"],
    auditContext: {
      actorUserId: null,
      reason: null,
      origin: null,
      approvedAt: null,
    },
    createdDossierId: null,
    createdWorkspaceId: null,
    guardrails: {
      noAutoCreateFromAiAlone: true,
      noAutoPublish: true,
      noVerifiedFactsByDefault: true,
      noVerifiedSourcesByDefault: true,
      noCommunityHintsAsTruth: true,
      noTrustOrSourceQualityAsVerification: true,
      noGraphEdgeAsProof: true,
      noMajorityAsTruth: true,
      noAnlassraumCreation: true,
      noParticipationSpaceCreation: true,
      auditContextRequired: true,
    },
    createdAt: "2026-06-30T08:00:00.000Z",
    updatedAt: "2026-06-30T08:00:00.000Z",
    auditTrail: [
      {
        id: "audit-1",
        sourceHandoffId: "handoff-1",
        at: "2026-06-30T08:00:00.000Z",
        action: "draft_derived",
        actorUserId: "admin-1",
        note: "Draft abgeleitet.",
        blockers: ["review_not_approved"],
        status: "queued_for_review",
      },
    ],
    approvedForCreationAt: null,
    approvedForCreationBy: null,
    rejectedAt: null,
    rejectedBy: null,
    ...overrides,
  };
}

describe("dossier runtime admin creation ui", () => {
  it("renders the admin review workbench section with title, summary, blockers and audit", () => {
    const blocked = buildRecord();
    const approved = buildRecord({
      id: "dossier-runtime:handoff-2",
      sourceHandoffId: "handoff-2",
      status: "approved_for_creation",
      blockers: [],
      auditContext: {
        actorUserId: "admin-1",
        reason: "Review-approved.",
        origin: "admin_review",
        approvedAt: "2026-06-30T09:00:00.000Z",
      },
      approvedForCreationAt: "2026-06-30T09:00:00.000Z",
      approvedForCreationBy: "admin-1",
    });

    const markup = renderToStaticMarkup(
      <AdminDossierRuntimeCreationSection
        dossierRuntimeRecords={[blocked, approved]}
        dossierRuntimeAuditMap={new Map([
          [blocked.sourceHandoffId, blocked.auditTrail],
          [approved.sourceHandoffId, approved.auditTrail],
        ])}
        dossierRuntimePersistence={{
          label: "Persistente Dossier-Runtime-Creation",
          summary: "Review-bestätigte Dossier-Creation bleibt auditierbar.",
          productionTruth: true,
        }}
      />,
    );

    expect(markup).toContain("Dossier erstellen prüfen");
    expect(markup).toContain("Sichere Schulwege");
    expect(markup).toContain("Welche Kreuzungen sind zuerst kritisch?");
    expect(markup).toContain("Explizite Freigabe zur Dossier-Erstellung fehlt.");
    expect(markup).toContain("Audit Trail");
    expect(markup).toContain(
      "Dieses Dossier wird nur nach redaktioneller Freigabe erstellt.",
    );
  });

  it("disables create while blockers exist and enables it after approval", () => {
    const blockedMarkup = renderToStaticMarkup(
      <DossierRuntimeCreationActions record={buildRecord()} />,
    );
    const approvedMarkup = renderToStaticMarkup(
      <DossierRuntimeCreationActions
        record={buildRecord({
          sourceHandoffId: "handoff-2",
          status: "approved_for_creation",
          blockers: [],
          auditContext: {
            actorUserId: "admin-1",
            reason: "Review-approved.",
            origin: "admin_review",
            approvedAt: "2026-06-30T09:00:00.000Z",
          },
          approvedForCreationAt: "2026-06-30T09:00:00.000Z",
          approvedForCreationBy: "admin-1",
        })}
      />,
    );

    expect(blockedMarkup).toContain('data-testid="create-dossier-runtime-handoff-1"');
    expect(blockedMarkup).toContain('data-testid="create-dossier-runtime-handoff-1" disabled=""');
    expect(approvedMarkup).toContain('data-testid="create-dossier-runtime-handoff-2"');
    expect(approvedMarkup).not.toContain('data-testid="create-dossier-runtime-handoff-2" disabled=""');
  });
});
