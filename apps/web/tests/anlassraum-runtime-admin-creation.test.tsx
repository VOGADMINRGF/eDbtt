import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AnlassraumRuntimeRecord } from "@/features/create/anlassraumRuntime";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import AdminAnlassraumRuntimeCreationSection from "@/app/admin/review/AdminAnlassraumRuntimeCreationSection";
import AnlassraumRuntimeCreationActions from "@/app/admin/review/AnlassraumRuntimeCreationActions";

function buildRecord(
  overrides: Partial<AnlassraumRuntimeRecord> = {},
): AnlassraumRuntimeRecord {
  return {
    id: "anlassraum-runtime:handoff-1",
    sourceHandoffId: "handoff-1",
    sourceReviewItemId: "create_handoff:persisted:handoff-1",
    statementId: "create-handoff:handoff-1",
    title: "Anlassraum vorbereiten: Sichere Schulwege",
    workingTitle: "Anlassraum vorbereiten: Sichere Schulwege",
    trigger: "Welche Kreuzungen sind zuerst kritisch?",
    description: "1 Aussage · 1 offene Frage. Sichere Schulwege sollen im Anlassraum weitergeführt werden.",
    relatedDossierId: "dossier-sichere-schulwege",
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
    dossierContextPending: false,
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
    createdAnlassraumId: null,
    createdEntityId: null,
    guardrails: {
      noAutoCreateFromAiAlone: true,
      noAutoPublish: true,
      noParticipationSpaceSideEffect: true,
      noVerifiedFactsByDefault: true,
      noVerifiedSourcesByDefault: true,
      noCommunityHintsAsTruth: true,
      noTrustOrSourceQualityAsVerification: true,
      noGraphEdgeAsProof: true,
      noDossierContextAsProof: true,
      noMajorityAsTruth: true,
      noAutoGraphWrite: true,
      noAutoMerge: true,
      auditContextRequired: true,
      createdNotPublished: true,
      activeInternalNotPublic: true,
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

describe("anlassraum runtime admin creation ui", () => {
  it("renders the admin review workbench section with title, trigger, blockers and audit", () => {
    const blocked = buildRecord();
    const approved = buildRecord({
      id: "anlassraum-runtime:handoff-2",
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
      <AdminAnlassraumRuntimeCreationSection
        anlassraumRuntimeRecords={[blocked, approved]}
        anlassraumRuntimeAuditMap={new Map([
          [blocked.sourceHandoffId, blocked.auditTrail],
          [approved.sourceHandoffId, approved.auditTrail],
        ])}
        anlassraumRuntimePersistence={{
          label: "Persistente Anlassraum-Runtime-Creation",
          summary: "Review-bestätigte Anlassraum-Creation bleibt auditierbar.",
          productionTruth: true,
        }}
      />,
    );

    expect(markup).toContain("Anlassraum erstellen prüfen");
    expect(markup).toContain("Sichere Schulwege");
    expect(markup).toContain("Welche Kreuzungen sind zuerst kritisch?");
    expect(markup).toContain("Explizite Freigabe zur Anlassraum-Erstellung fehlt.");
    expect(markup).toContain("Audit Trail");
    expect(markup).toContain(
      "Dieser Anlassraum wird nur nach redaktioneller Freigabe erstellt.",
    );
    expect(markup).toContain(
      "Ein Anlassraum ist ein interner Arbeits-/Bündelungsraum, kein öffentlicher Beteiligungsraum.",
    );
  });

  it("disables create while blockers exist and enables it after approval", () => {
    const blockedMarkup = renderToStaticMarkup(
      <AnlassraumRuntimeCreationActions record={buildRecord()} />,
    );
    const approvedMarkup = renderToStaticMarkup(
      <AnlassraumRuntimeCreationActions
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

    expect(blockedMarkup).toContain('data-testid="create-anlassraum-runtime-handoff-1"');
    expect(blockedMarkup).toContain(
      'data-testid="create-anlassraum-runtime-handoff-1" disabled=""',
    );
    expect(approvedMarkup).toContain('data-testid="create-anlassraum-runtime-handoff-2"');
    expect(approvedMarkup).not.toContain(
      'data-testid="create-anlassraum-runtime-handoff-2" disabled=""',
    );
  });
});
