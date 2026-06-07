import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
  buildReviewQueueReadModel: vi.fn(),
  listEditorialReviewRequests: vi.fn(),
  factcheckList: vi.fn(),
  loadAdminGraphMergeSectionProps: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

vi.mock("@features/reviewQueue", () => ({
  buildReviewQueueReadModel: (...args: unknown[]) => mocks.buildReviewQueueReadModel(...args),
}));

vi.mock("@features/editorialReviewQueue", () => ({
  listEditorialReviewRequests: (...args: unknown[]) => mocks.listEditorialReviewRequests(...args),
  matchesEditorialReviewFilter: (request: any, filter: string) => {
    if (filter === "all") return true;
    if (filter === "source_open") return request.reason === "source_open";
    return true;
  },
  getEditorialReviewFilterLabel: (value: string) => value,
  getEditorialReviewNextStepLabel: (input: { sourceType: string; status: string }) =>
    `${input.sourceType}:${input.status}`,
  getEditorialReviewReasonLabel: (value: string) => value,
  getEditorialReviewSourceTypeLabel: (value: string) => value,
  getEditorialReviewStatusLabel: (value: string) => value,
}));

vi.mock("@/app/admin/review/loadAdminGraphMergeSectionProps", () => ({
  loadAdminGraphMergeSectionProps: (...args: unknown[]) =>
    mocks.loadAdminGraphMergeSectionProps(...args),
}));

vi.mock("@features/factcheck/db", () => ({
  getFactcheckWorkflowRepo: () => ({
    list: (...args: unknown[]) => mocks.factcheckList(...args),
  }),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

import AdminReviewPage from "@/app/admin/review/page";

describe("/admin/review page editorial section", () => {
  it("renders editorial review requests as guarded manual work items", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.factcheckList.mockResolvedValue([]);
    mocks.loadAdminGraphMergeSectionProps.mockResolvedValue({
      graphAuditMap: new Map(),
      graphCandidatePersistence: {
        mode: "persistent_primary",
        label: "Persistenter Graph-Candidate-Store",
        summary: "Graph-Kandidaten liegen dauerhaft vor.",
        repositoryInterface: "GraphMergeCandidatesRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      graphMergeCandidates: [],
    });
    mocks.buildReviewQueueReadModel.mockResolvedValue({
      items: [],
      summary: {
        total: 0,
        totalBeforeFilters: 0,
        highPriorityCount: 0,
        assignedCount: 0,
        readyCount: 0,
        blockedCount: 0,
        officialApprovalCount: 0,
        byOperationalStatus: [],
      },
      filters: {
        applied: {
          domain: "all",
          operationalStatus: "all",
          regionId: "all",
          organizationId: "all",
          priority: "all",
          assignedToUserId: "all",
          visibilityState: "all",
          sort: "priority",
        },
        options: {
          domains: [],
          statuses: [],
          regions: [],
          organizations: [],
          priorities: [],
          assignees: [],
          visibilities: [],
          sorts: [],
        },
      },
      operationsPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Operations-Store",
        summary: "Auditierte Review-Operationen liegen dauerhaft vor.",
        productionTruth: true,
      },
      contentReleasePersistence: {
        mode: "persistent_primary",
        label: "Persistenter Content-Release-Store",
        summary: "Sichtbarkeit und Archivierung liegen dauerhaft vor.",
        repositoryInterface: "ContentReleaseRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      guardrails: {
        noBulkApprove: true,
        noAutoOfficialClaim: true,
        noAutoPublish: true,
        noAutoDossierFinalization: true,
        noAutoAnlassraumFinalization: true,
      },
    });
    mocks.listEditorialReviewRequests.mockResolvedValue([
      {
        id: "editorial-1",
        sourceType: "create_analysis",
        originalText: "Bitte prüft die Analyse zur Schulwegsicherheit redaktionell.",
        truthStatus: "source_open",
        sourceSupport: "open",
        sourceStatus: "Quellenlage offen",
        reviewRecommended: true,
        verificationLabel: "analysiert",
        noTruthPromotion: true,
        reason: "source_open",
        status: "pending_review",
        createdAt: "2026-06-06T10:00:00.000Z",
        updatedAt: "2026-06-06T10:30:00.000Z",
        userReplies: [
          {
            id: "reply-1",
            text: "Es geht um den Zebrastreifen vor der Grundschule an der Musterstraße in Reinickendorf.",
            createdAt: "2026-06-06T10:30:00.000Z",
            userId: "user-1",
          },
        ],
        lastUserReplyAt: "2026-06-06T10:30:00.000Z",
        lastAction: "user_replied",
        noAutoPublish: true,
        noAutoGraphPromotion: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoVote: true,
      },
      {
        id: "editorial-2",
        sourceType: "theme_suggestion",
        originalText: "Bitte den Radweg vor der Grundschule als Themenvorschlag prüfen.",
        truthStatus: "review_required",
        sourceSupport: "open",
        sourceStatus: "Prüfung empfohlen",
        reviewRecommended: true,
        verificationLabel: "analysiert",
        noTruthPromotion: true,
        reason: "editorial_escalation",
        status: "accepted_for_workup",
        reviewerNote: "Kann als Thema weiter vorbereitet werden.",
        userVisibleNote: "Kann als Thema weiter vorbereitet werden.",
        createdAt: "2026-06-06T11:00:00.000Z",
        updatedAt: "2026-06-06T11:00:00.000Z",
        noAutoPublish: true,
        noAutoGraphPromotion: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoVote: true,
      },
    ]);

    const html = renderToStaticMarkup(await AdminReviewPage());

    expect(html).toContain("Redaktionelle Prüfbitten");
    expect(html).toContain("Bitte prüft die Analyse zur Schulwegsicherheit redaktionell.");
    expect(html).toContain("Nutzer hat geantwortet");
    expect(html).toContain("Letzte Antwort");
    expect(html).toContain("Es geht um den Zebrastreifen vor der Grundschule an der Musterstraße in Reinickendorf.");
    expect(html).toContain("Themenvorschlag");
    expect(html).toContain("Kann als Thema weiter vorbereitet werden.");
    expect(html).toContain("source_open");
    expect(html).toContain("open");
    expect(html).not.toContain("direkt veröffentlichen");
  });
});
