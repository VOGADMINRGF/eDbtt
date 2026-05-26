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

describe("social distribution queue readmodel", () => {
  beforeEach(() => {
    setSocialDistributionRepoForTests(
      createInMemorySocialDistributionRepo({
        posts: [
          {
            id: "social-dist-1",
            organizationId: "org-1",
            regionId: "berlin",
            dossierId: "dossier-1",
            sourceContextType: "dossier",
            sourceContextId: "dossier-1",
            sourceVisibilityState: "public_reviewed",
            sourceState: "approved_context",
            title: "Schulwege im Bezirk",
            status: "queued",
            channels: ["website_update", "newsletter_draft", "qr_asset", "linkedin_draft"],
            scheduleMode: "manual",
            channelTexts: { website_update: "Update" },
            channelNotes: {},
            assets: [
              {
                id: "share-ref-1",
                channel: "website_update",
                kind: "share_reference",
                label: "Share-Referenz",
                href: "/dossier/dossier-1",
                text: "Kontext",
                verificationLabel: "analysiert",
                sealGranted: false,
                publicSafe: true,
              },
            ],
            approval: {
              reviewRequired: true,
              approvedByUserId: null,
              approvedAt: null,
              note: "Bitte erst mit Dossier-Stand abgleichen.",
            },
            sourceSummary: "Dossier-Stand mit offenen Fragen",
            limitations: ["Keine externe Veröffentlichung im V1-Pfad."],
            noAutoPublish: true,
            noAutoPublicationApproved: true,
            noPublicOfficial: true,
            externalPosting: false,
            createdByUserId: "user-1",
            updatedByUserId: "user-1",
            createdAt: "2026-05-25T08:00:00.000Z",
            updatedAt: "2026-05-25T08:10:00.000Z",
          },
        ],
      }),
    );

    mocks.buildDossierUpdateReadModel.mockResolvedValue({
      dossierId: "dossier-1",
      statementId: "statement-1",
      items: [
        {
          id: "suggestion-1",
          dossierId: "dossier-1",
          statementId: "statement-1",
          title: "Offene Frage aus Feed-Hinweis",
          summary: "Noch unklare Prioritäten bei Schulwegsicherheit.",
          origin: "feed",
          originLabel: "Feed-Radar",
          section: "question",
          sectionLabel: "Offene Frage",
          status: "question_hint_added",
          statusLabel: "Offene Frage ergänzt",
          statusDescription: "Beschreibung",
          tone: "warning",
          moderationStatus: "pending",
          reviewRequired: true,
          reviewHint: "Vor Veröffentlichung einordnen.",
          riskHint: "Noch keine belastbare Verdichtung.",
          nextAction: "Im Dossier prüfen.",
          dossierHref: "/dossier/dossier-1",
          anlassraumHref: "/runden?anlassraumId=1",
          swipesHref: "/swipes?draft=1",
          sourceHref: "/admin/feeds",
          createdAt: "2026-05-25T08:20:00.000Z",
          updatedAt: "2026-05-25T08:20:00.000Z",
        },
      ],
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
        total: 1,
        reviewRequired: 1,
        published: 0,
        rejected: 0,
      },
    });

    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "runde-1",
        title: "Anlassraum Schule",
        summary: "Öffentliche Beteiligung läuft.",
        entryHref: "/runden?anlassraumId=1",
        operatingHref: "/runden?anlassraumId=1",
        updatedAt: "2026-05-25T07:55:00.000Z",
        shareActions: {
          socialCandidate: true,
          needsReviewBeforeOfficialSocial: true,
          canonicalTarget: "/runden?anlassraumId=1",
          qrTarget: "/runden?anlassraumId=1",
          existingContextHint: "Beteiligung läuft bereits.",
        },
        relatedDossierHref: "/dossier/dossier-1",
      },
    ]);

    mocks.buildFeedRadarRuntimeReadModel.mockResolvedValue({
      queue: {
        queuedDrafts: 2,
        clusteredCandidates: 1,
        attachedAnlassraum: 1,
        attachedDossier: 1,
      },
      nextAction: {
        action: "review_drafts",
        label: "Feed-Vorschläge prüfen",
        description: "Feed-Drafts warten auf Review.",
        href: "/admin/feeds",
      },
      publicHandoffs: [
        { surface: "swipes", href: "/swipes", label: "Zu Swipes", description: "" },
        { surface: "runden", href: "/runden", label: "Zum Anlassraum", description: "" },
      ],
      runs: [
        {
          runType: "pull",
          status: "success",
          requestedAt: "2026-05-25T07:00:00.000Z",
          completedAt: "2026-05-25T07:05:00.000Z",
          label: "Abruf",
          detail: "2 neu",
          error: null,
        },
      ],
    });
  });

  it("consolidates dossier, anlassraum and feed signals into one derived queue", async () => {
    const model = await loadSocialDistributionQueueReadModel({ dossierId: "dossier-1", limit: 20 });

    expect(model.guardrails).toMatchObject({
      noAutoPublish: true,
      noOauthConnectors: true,
      derivedQueue: true,
    });
    expect(model.items.some((item) => item.origin === "dossier_masterpost")).toBe(true);
    expect(model.items.some((item) => item.origin === "newsletter_block")).toBe(true);
    expect(model.items.some((item) => item.origin === "qr_event_hint")).toBe(true);
    expect(model.items.some((item) => item.origin === "short_post")).toBe(true);
    expect(model.items.some((item) => item.origin === "dossier_update")).toBe(true);
    expect(model.items.some((item) => item.origin === "anlassraum_update")).toBe(true);
    expect(model.summary.reviewOpen).toBeGreaterThan(0);
  });

  it("adds a feed runtime queue item on the global queue surface", async () => {
    const model = await loadSocialDistributionQueueReadModel({ limit: 20 });
    const feedItem = model.items.find((item) => item.origin === "feed_radar_update");

    expect(feedItem).toMatchObject({
      status: "needs_review",
      targetHref: "/admin/feeds",
      reviewRequired: true,
    });
  });
});
