import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ParticipationSpaceRuntimeRecord } from "@/features/create/participationSpaceRuntime";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import AdminParticipationSpaceRuntimeCreationSection from "@/app/admin/review/AdminParticipationSpaceRuntimeCreationSection";
import ParticipationSpaceRuntimeCreationActions from "@/app/admin/review/ParticipationSpaceRuntimeCreationActions";

function buildRecord(
  overrides: Partial<ParticipationSpaceRuntimeRecord> = {},
): ParticipationSpaceRuntimeRecord {
  return {
    id: "participation-space-runtime:handoff-1",
    sourceHandoffId: "handoff-1",
    sourceReviewItemId: "create_handoff:persisted:handoff-1",
    statementId: "create-handoff:handoff-1",
    title: "Beteiligungsraum Sichere Schulwege",
    workingTitle: "Beteiligungsraum Sichere Schulwege",
    description:
      "1 Aussage · 1 offene Frage. Sichere Schulwege sollen im Beteiligungsraum weitergeführt werden.",
    participationQuestion: "Welche Kreuzungen sind zuerst kritisch?",
    relatedAnlassraumId: "65a111111111111111111110",
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
    anlassraumContextPending: false,
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
    createdParticipationSpaceId: null,
    createdParticipationSpaceSlug: null,
    guardrails: {
      noAutoCreateFromAiAlone: true,
      noAutoPublish: true,
      noAutoActivation: true,
      noPublicVisibilitySideEffect: true,
      noVerifiedFactsByDefault: true,
      noVerifiedSourcesByDefault: true,
      noCommunityHintsAsTruth: true,
      noTrustOrSourceQualityAsVerification: true,
      noGraphEdgeAsProof: true,
      noDossierContextAsProof: true,
      noAnlassraumContextAsProof: true,
      noMajorityAsTruth: true,
      noAutoGraphWrite: true,
      noAutoMerge: true,
      auditContextRequired: true,
      approvedForCreationNotPublic: true,
      createdNotPublic: true,
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

describe("participation space runtime admin creation ui", () => {
  it("renders the admin review workbench section with title, question, blockers and audit", () => {
    const blocked = buildRecord();
    const approved = buildRecord({
      id: "participation-space-runtime:handoff-2",
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
      <AdminParticipationSpaceRuntimeCreationSection
        participationSpaceRuntimeRecords={[blocked, approved]}
        participationSpaceRuntimeAuditMap={new Map([
          [blocked.sourceHandoffId, blocked.auditTrail],
          [approved.sourceHandoffId, approved.auditTrail],
        ])}
        participationSpaceRuntimePersistence={{
          label: "Persistente Beteiligungsraum-Runtime-Creation",
          summary:
            "Review-bestätigte Beteiligungsraum-Creation bleibt auditierbar.",
          productionTruth: true,
        }}
      />,
    );

    expect(markup).toContain("Beteiligungsraum erstellen prüfen");
    expect(markup).toContain("Sichere Schulwege");
    expect(markup).toContain("Welche Kreuzungen sind zuerst kritisch?");
    expect(markup).toContain(
      "Explizite Freigabe zur Beteiligungsraum-Erstellung fehlt.",
    );
    expect(markup).toContain("Audit Trail");
    expect(markup).toContain(
      "Dieser Beteiligungsraum wird nur nach redaktioneller Freigabe erstellt.",
    );
    expect(markup).toContain(
      "Erstellung bedeutet keine öffentliche Aktivierung.",
    );
  });

  it("disables create while blockers exist and enables it after approval", () => {
    const blockedMarkup = renderToStaticMarkup(
      <ParticipationSpaceRuntimeCreationActions record={buildRecord()} />,
    );
    const approvedMarkup = renderToStaticMarkup(
      <ParticipationSpaceRuntimeCreationActions
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

    expect(blockedMarkup).toContain(
      'data-testid="create-participation-space-runtime-handoff-1"',
    );
    expect(blockedMarkup).toContain(
      'data-testid="create-participation-space-runtime-handoff-1" disabled=""',
    );
    expect(approvedMarkup).toContain(
      'data-testid="create-participation-space-runtime-handoff-2"',
    );
    expect(approvedMarkup).not.toContain(
      'data-testid="create-participation-space-runtime-handoff-2" disabled=""',
    );
  });
});
