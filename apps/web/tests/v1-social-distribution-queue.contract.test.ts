import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadSocialDistributionQueueReadModel,
} from "@features/outputEngine";
import {
  createInMemorySocialDistributionRepo,
  setSocialDistributionRepoForTests,
} from "@features/outputEngine/socialDistributionRuntime";

const mocks = vi.hoisted(() => ({
  buildDossierUpdateReadModel: vi.fn(),
  listRundenEntryItems: vi.fn(),
  buildFeedRadarRuntimeReadModel: vi.fn(),
}));

vi.mock("@features/dossier/updateReadModel", () => ({
  buildDossierUpdateReadModel: (...args: unknown[]) => mocks.buildDossierUpdateReadModel(...args),
}));

vi.mock("@features/topicRound/entrySource", () => ({
  listRundenEntryItems: (...args: unknown[]) => mocks.listRundenEntryItems(...args),
}));

vi.mock("@features/feeds/runtimeReadModel", () => ({
  buildFeedRadarRuntimeReadModel: (...args: unknown[]) => mocks.buildFeedRadarRuntimeReadModel(...args),
}));

describe("v1 social distribution queue", () => {
  beforeEach(() => {
    setSocialDistributionRepoForTests(
      createInMemorySocialDistributionRepo({
        posts: [
          {
            id: "social-dist-v1",
            organizationId: "org-1",
            regionId: "berlin",
            dossierId: "dossier-1",
            sourceContextType: "dossier",
            sourceContextId: "dossier-1",
            sourceVisibilityState: "public_reviewed",
            sourceState: "approved_context",
            title: "Bezirksupdate Bildung",
            status: "scheduled_ready",
            channels: ["website_update", "newsletter_draft", "qr_asset"],
            scheduleMode: "scheduled_at",
            channelTexts: { website_update: "Update" },
            channelNotes: {},
            assets: [],
            approval: {
              reviewRequired: false,
              approvedByUserId: "admin-1",
              approvedAt: "2026-05-25T10:00:00.000Z",
              note: "Freigegeben.",
            },
            sourceSummary: "Quellenlage im Dossier",
            limitations: ["Kein Auto-Publish."],
            noAutoPublish: true,
            noAutoPublicationApproved: true,
            noPublicOfficial: true,
            externalPosting: false,
            createdByUserId: "user-1",
            updatedByUserId: "admin-1",
            createdAt: "2026-05-25T09:00:00.000Z",
            updatedAt: "2026-05-25T10:00:00.000Z",
          },
        ],
      }),
    );

    mocks.buildDossierUpdateReadModel.mockResolvedValue({
      dossierId: "dossier-1",
      statementId: "statement-1",
      items: [],
      publicContext: {
        checkedStandLabel: "Geprüfter Stand",
        checkedStandHint: "Hint",
        latestPublicUpdateAt: null,
        latestReviewUpdateAt: null,
        publishedItems: [],
        reviewItems: [],
        originSummary: [],
        sectionSummary: [],
        relatedContext: {
          dossierHref: "/dossier/dossier-1",
          anlassraumHref: null,
          anlassraumLabel: null,
          swipesHref: null,
          swipesLabel: null,
        },
      },
      summary: {
        total: 0,
        reviewRequired: 0,
        published: 0,
        rejected: 0,
      },
    });
    mocks.listRundenEntryItems.mockResolvedValue([]);
    mocks.buildFeedRadarRuntimeReadModel.mockResolvedValue({
      queue: {
        queuedDrafts: 0,
        clusteredCandidates: 0,
        attachedAnlassraum: 0,
        attachedDossier: 0,
      },
      nextAction: {
        action: "monitor",
        label: "Monitoring",
        description: "Keine offenen Schritte.",
        href: "/admin/feeds",
      },
      publicHandoffs: [],
      runs: [],
    });
  });

  it("keeps the queue review-first, scheduling-ready and free of publish language", async () => {
    const model = await loadSocialDistributionQueueReadModel({ dossierId: "dossier-1" });

    expect(model.summary).toMatchObject({
      total: 3,
      reviewOpen: 0,
      scheduledReady: 3,
    });
    expect(model.items.every((item) => item.statusLabel.toLowerCase().includes("veröffentlicht"))).toBe(
      false,
    );
    expect(model.items.some((item) => item.origin === "newsletter_block")).toBe(true);
    expect(model.items.some((item) => item.origin === "qr_event_hint")).toBe(true);
  });
});
