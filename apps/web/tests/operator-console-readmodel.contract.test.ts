import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildReviewQueueReadModel: vi.fn(),
  buildAutonomousThemenradarReadModel: vi.fn(),
  buildFeedRadarRuntimeReadModel: vi.fn(),
  buildMaterialExtractionJobReadModel: vi.fn(),
  loadSocialDistributionQueueReadModel: vi.fn(),
  listPricingOrders: vi.fn(),
  listEntitlementsForAdmin: vi.fn(),
  countDocuments: vi.fn(),
  latestSuggestions: vi.fn(),
}));

vi.mock("@features/reviewQueue", () => ({
  buildReviewQueueReadModel: (...args: unknown[]) => mocks.buildReviewQueueReadModel(...args),
}));

vi.mock("@features/themenradar/autonomousSupply", () => ({
  buildAutonomousThemenradarReadModel: (...args: unknown[]) =>
    mocks.buildAutonomousThemenradarReadModel(...args),
}));

vi.mock("@features/feeds/runtimeReadModel", () => ({
  buildFeedRadarRuntimeReadModel: (...args: unknown[]) => mocks.buildFeedRadarRuntimeReadModel(...args),
}));

vi.mock("@/features/material/materialExtractionJobs", () => ({
  buildMaterialExtractionJobReadModel: (...args: unknown[]) =>
    mocks.buildMaterialExtractionJobReadModel(...args),
}));

vi.mock("@features/outputEngine/socialDistributionQueueReadModel", () => ({
  loadSocialDistributionQueueReadModel: (...args: unknown[]) =>
    mocks.loadSocialDistributionQueueReadModel(...args),
}));

vi.mock("@features/pricing/server/leadsRepo", () => ({
  listPricingOrders: (...args: unknown[]) => mocks.listPricingOrders(...args),
}));

vi.mock("@features/region", () => ({
  getRegionEntitlementRuntimeRepo: () => ({
    listEntitlementsForAdmin: (...args: unknown[]) => mocks.listEntitlementsForAdmin(...args),
  }),
}));

vi.mock("@features/dossier/db", () => ({
  dossierSuggestionsCol: async () => ({
    countDocuments: (...args: unknown[]) => mocks.countDocuments(...args),
    find: () => ({
      sort: () => ({
        limit: () => ({
          toArray: (...args: unknown[]) => mocks.latestSuggestions(...args),
        }),
      }),
    }),
  }),
}));

import {
  OPERATOR_CONSOLE_REAL_ACTION_ROUTES,
  buildOperatorConsoleReadModel,
} from "@/features/admin/operatorConsoleReadModel";

describe("operator console readmodel contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.buildReviewQueueReadModel.mockResolvedValue({
      items: [],
      operationsPersistence: null,
      contentReleasePersistence: null,
      summary: {
        total: 11,
        totalBeforeFilters: 11,
        officialApprovalCount: 1,
        highPriorityCount: 3,
        assignedCount: 2,
        blockedCount: 1,
        readyCount: 4,
        byDomain: [],
        byOperationalStatus: [],
      },
      filters: {
        applied: {},
        options: {},
      },
      guardrails: {},
    });

    mocks.buildAutonomousThemenradarReadModel.mockResolvedValue({
      generatedAt: "2026-05-27T12:00:00.000Z",
      items: [],
      summary: {
        totalClusters: 7,
        strongSignals: 4,
        duplicates: 1,
        reviewRequired: 5,
        weakEvidence: 2,
        regionalHotspots: 2,
        reactivated: 1,
        stale: 1,
        nextAction: {
          label: "Themenradar prüfen",
          description: "Review-first weiterarbeiten.",
          href: "/admin/themenradar",
        },
      },
    });

    mocks.buildFeedRadarRuntimeReadModel.mockResolvedValue({
      sourceStatus: {
        status: "warning",
        label: "Review-Lage aktiv",
        description: "Feed-Signale brauchen Aufmerksamkeit.",
      },
      metrics: {
        errors: { key: "errors", label: "Fehler", value: 2, status: "attention", description: "" },
        review: { key: "review", label: "Review", value: 6, status: "review", description: "" },
      },
      runs: [],
      nextAction: {
        action: "check_errors",
        label: "Fehler prüfen",
        description: "Fehlerhafte Quellen zuerst öffnen.",
        href: "/admin/feeds",
      },
      publicHandoffs: [],
      queue: {
        queuedDrafts: 5,
        clusteredCandidates: 2,
        attachedAnlassraum: 1,
        attachedDossier: 1,
      },
      topicSupply: {
        totalVisible: 4,
        reviewRequired: 1,
        buckets: [],
        sources: [],
        nextAction: {
          label: "Swipes prüfen",
          description: "Öffentliche Themenlage prüfen.",
          href: "/swipes",
        },
      },
      sourceAutomation: {
        generatedAt: "2026-05-27T12:00:00.000Z",
        items: [],
        summary: {
          totalSources: 9,
          healthySources: 5,
          noisySources: 1,
          failingSources: 2,
          quietSources: 1,
          backoffSources: 1,
          reviewCandidateCount: 4,
          cronReadySources: 5,
          manualSources: 1,
          themenradarReadySources: 3,
          nextAction: {
            label: "Source Automation öffnen",
            description: "Fehler und Review-Kandidaten prüfen.",
            href: "/admin/feeds#source-automation",
          },
        },
      },
      materialExtraction: {
        generatedAt: "2026-05-27T12:00:00.000Z",
        items: [],
        summary: {
          totalJobs: 0,
          waitingJobs: 0,
          failedJobs: 0,
          blockedJobs: 0,
          approvalRequiredJobs: 0,
          reviewReadyJobs: 0,
          dossierHandoffs: 0,
          themenradarHandoffs: 0,
          nextAction: {
            label: "Material öffnen",
            description: "Keine Jobs offen.",
            href: "/admin/feeds#material-extraction-jobs",
          },
        },
      },
      aiOrchestration: {
        feedSignal: {
          lane: "feed_signal",
          laneLabel: "Feed Signal",
          outputLabel: "Review-only",
          reviewRequired: true,
          draftOnly: true,
          publicOutputAllowed: false,
        },
        themenradar: {
          lane: "themenradar_cluster",
          laneLabel: "Themenradar",
          outputLabel: "Review-only",
          reviewRequired: true,
          draftOnly: true,
          publicOutputAllowed: false,
        },
        materialExtraction: {
          lane: "material_extraction",
          laneLabel: "Material",
          outputLabel: "Review-only",
          reviewRequired: true,
          draftOnly: true,
          publicOutputAllowed: false,
          costApprovalRequired: true,
        },
      },
    });

    mocks.buildMaterialExtractionJobReadModel.mockResolvedValue({
      generatedAt: "2026-05-27T12:00:00.000Z",
      items: [],
      summary: {
        totalJobs: 6,
        waitingJobs: 3,
        failedJobs: 1,
        blockedJobs: 0,
        approvalRequiredJobs: 2,
        reviewReadyJobs: 2,
        dossierHandoffs: 1,
        themenradarHandoffs: 1,
        nextAction: {
          label: "Material Jobs öffnen",
          description: "Jobs prüfen.",
          href: "/admin/feeds#material-extraction-jobs",
        },
      },
      persistence: {
        mode: "persistent_primary",
      },
      intakePersistence: {
        mode: "persistent_primary",
      },
    });

    mocks.loadSocialDistributionQueueReadModel.mockResolvedValue({
      generatedAt: "2026-05-27T12:00:00.000Z",
      summary: {
        total: 8,
        reviewOpen: 3,
        queued: 2,
        scheduledReady: 2,
        exported: 1,
        blocked: 1,
      },
      guardrails: {
        noAutoPublish: true,
        noOauthConnectors: true,
        noOfficialClaim: true,
        derivedQueue: true,
      },
      items: [],
    });

    mocks.listEntitlementsForAdmin.mockResolvedValue([
      { id: "ent-1", status: "active" },
      { id: "ent-2", status: "past_due" },
    ]);

    mocks.listPricingOrders.mockResolvedValue([
      {
        id: "order-1",
        status: "submitted",
        internal: { billingSource: "operator_verified_contract" },
      },
      {
        id: "order-2",
        status: "under_review",
        internal: { billingSource: "external_checkout_pending" },
      },
    ]);

    mocks.countDocuments.mockImplementation(async (query?: { status?: string }) => {
      if (query?.status === "pending") return 4;
      if (query?.status === "accepted") return 2;
      if (query?.status === "rejected") return 1;
      return 0;
    });

    mocks.latestSuggestions.mockResolvedValue([{ dossierId: "dossier-1" }]);
  });

  it("aggregates existing operator surfaces without inventing fake actions", async () => {
    const readModel = await buildOperatorConsoleReadModel({ userId: "admin-1" });

    expect(readModel.hero).toMatchObject({
      openOperatorTasks: 11,
      sourceFailures: 2,
      waitingMaterialJobs: 3,
      pendingDossierUpdates: 4,
      socialQueueReviewOpen: 3,
    });

    expect(readModel.areas.map((area) => area.key)).toEqual(
      expect.arrayContaining([
        "review_queue",
        "themenradar",
        "feed_health",
        "source_automation",
        "material_jobs",
        "dossier_updates",
        "social_queue",
        "payments",
      ]),
    );

    const sourceAutomationArea = readModel.areas.find((area) => area.key === "source_automation");
    expect(sourceAutomationArea).toMatchObject({
      href: "/admin/feeds#source-automation",
      state: "attention",
    });

    const paymentArea = readModel.areas.find((area) => area.key === "payments");
    expect(paymentArea).toMatchObject({
      href: "/admin/pricing/orders",
      actionLabel: "Pricing Orders öffnen",
    });

    expect(readModel.nextActions.length).toBeGreaterThan(0);
    for (const action of readModel.nextActions) {
      expect(OPERATOR_CONSOLE_REAL_ACTION_ROUTES).toContain(action.href);
      expect(action.label).not.toMatch(/auto veröffentlichen|live posten|oauth/i);
    }
  });
});
