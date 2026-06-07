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
  buildReviewQueueReadModel: (...args: unknown[]) =>
    mocks.buildReviewQueueReadModel(...args),
}));

vi.mock("@features/editorialReviewQueue", () => ({
  listEditorialReviewRequests: (...args: unknown[]) =>
    mocks.listEditorialReviewRequests(...args),
  getEditorialReviewFilterLabel: (value: string) => value,
}));

vi.mock("@features/factcheck/db", () => ({
  getFactcheckWorkflowRepo: () => ({
    list: (...args: unknown[]) => mocks.factcheckList(...args),
  }),
}));

vi.mock("@/app/admin/review/loadAdminGraphMergeSectionProps", () => ({
  loadAdminGraphMergeSectionProps: (...args: unknown[]) =>
    mocks.loadAdminGraphMergeSectionProps(...args),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

import AdminReviewPage from "@/app/admin/review/page";

describe("/admin/review page graph candidates", () => {
  it("renders graph candidate working states and merge gates without auto-publish claims", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.listEditorialReviewRequests.mockResolvedValue([]);
    mocks.factcheckList.mockResolvedValue([]);
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
      operationsPersistence: null,
      contentReleasePersistence: null,
    });
    mocks.loadAdminGraphMergeSectionProps.mockResolvedValue({
      graphCandidatePersistence: {
        mode: "persistent_primary",
        label: "Persistenter Graph-Candidate-Store",
        summary:
          "Graph-Kandidaten, Merge-Gates und auditierte Bestätigungen liegen dauerhaft vor.",
        repositoryInterface: "GraphMergeCandidatesRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      graphAuditMap: new Map([
        [
          "graph-1",
          {
            id: "audit-1",
            candidateId: "graph-1",
            sourceType: "theme_suggestion",
            sourceId: "theme-1",
            mergedBy: "admin-1",
            mergedAt: "2026-06-06T11:25:00.000Z",
            action: "merge_blocked",
            reason: "blocked_duplicate_unresolved",
            truthStatus: "review_required",
            sourceSupport: "open",
            verificationLabel: "analysiert",
            noAutoPublish: true,
          },
        ],
      ]),
      graphMergeCandidates: [
        {
          id: "graph-1",
          sourceType: "theme_suggestion",
          sourceId: "theme-1",
          reviewRequestId: "editorial-2",
          userId: "user-1",
          text: "Bitte den Radweg vor der Grundschule als Thema übernehmen.",
          normalizedText:
            "bitte den radweg vor der grundschule als thema übernehmen",
          candidateKind: "theme",
          proposedTitle: "Radweg vor der Grundschule",
          proposedSummary: "Themenkandidat aus redaktioneller Prüfung.",
          proposedClaims: [],
          proposedTopics: ["Radweg vor der Grundschule"],
          proposedSources: [],
          truthStatus: "review_required",
          sourceSupport: "open",
          sourceStatus: "Prüfung empfohlen",
          verificationLabel: "analysiert",
          reviewRecommended: true,
          reviewStatus: "accepted_for_staging",
          mergeStatus: "duplicate_suspected",
          duplicateCandidates: [
            {
              id: "graph-2",
              label: "Radweg vor der Grundschule Nord",
              matchType: "title_similarity",
              sourceType: "theme_suggestion",
              candidateKind: "theme",
              reviewStatus: "needs_review",
              mergeStatus: "not_started",
            },
          ],
          createdAt: "2026-06-06T11:20:00.000Z",
          updatedAt: "2026-06-06T11:20:00.000Z",
          noTruthPromotion: true,
          noAutoPublish: true,
          noAutoGraphPromotion: true,
          requiresEditorialConfirmation: true,
        },
        {
          id: "graph-merge-ready",
          sourceType: "factcheck_result",
          sourceId: "factcheck-2",
          reviewRequestId: null,
          userId: "user-2",
          text: "Belastbarer Claim für die bestätigte Zusammenführung.",
          normalizedText:
            "belastbarer claim für die bestätigte zusammenführung",
          candidateKind: "claim",
          proposedTitle: "Belastbarer Claim",
          proposedSummary: "Kandidat mit offenem Merge-Gate.",
          proposedClaims: [
            "Belastbarer Claim für die bestätigte Zusammenführung.",
          ],
          proposedTopics: [],
          proposedSources: ["https://example.org/quelle"],
          truthStatus: "sealed_verified",
          sourceSupport: "sourced",
          sourceStatus: "Quellenprüfung vorhanden",
          verificationLabel: "analysiert",
          reviewRecommended: false,
          reviewStatus: "staged",
          mergeStatus: "merge_ready",
          duplicateCandidates: [],
          createdAt: "2026-06-06T11:30:00.000Z",
          updatedAt: "2026-06-06T11:35:00.000Z",
          noTruthPromotion: true,
          noAutoPublish: true,
          noAutoGraphPromotion: true,
          requiresEditorialConfirmation: true,
        },
      ],
    });

    const html = renderToStaticMarkup(await AdminReviewPage());

    expect(html).toContain("Graph-Kandidaten");
    expect(html).toContain("Persistenter Graph-Candidate-Store");
    expect(html).toContain("Radweg vor der Grundschule");
    expect(html).toContain("Möglicherweise bereits vorhanden");
    expect(html).toContain("Merge-Gate");
    expect(html).toContain("Quellenlage offen");
    expect(html).toContain("Letzter Audit-Eintrag");
    expect(html).toContain(
      "Nur Admin/Redaktion kann hier Staging- und Zusammenführungsentscheidungen treffen.",
    );
    expect(html).toContain("Für Staging akzeptieren");
    expect(html).toContain("Als Duplikat markieren");
    expect(html).toContain("Duplikat als gelöst markieren");
    expect(html).toContain("Merge vorbereiten");
    expect(html).toContain("Produktiven Merge bestätigen");
    expect(html).toContain("Zur Klärung zurückgeben");
    expect(html).not.toContain("direkt veröffentlichen");
    expect(html).not.toContain("direkt Graph mergen");
    expect(html).not.toContain("direkt verifizieren");
  });
});
