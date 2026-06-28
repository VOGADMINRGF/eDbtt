import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier";
import {
  createInMemorySocialDistributionRepo,
  setSocialDistributionRepoForTests,
} from "@features/outputEngine/socialDistributionRuntime";

const mocks = vi.hoisted(() => ({
  loadSocialDistributionQueueReadModel: vi.fn(async () => ({
    generatedAt: "2026-06-28T00:00:00.000Z",
    summary: {
      total: 1,
      reviewOpen: 1,
      queued: 0,
      scheduledReady: 0,
      exported: 0,
      blocked: 0,
    },
    guardrails: {
      noAutoPublish: true,
      noOauthConnectors: true,
      noOfficialClaim: true,
      derivedQueue: true,
    },
    items: [
      {
        id: "queue-item-1",
        title: "Dossier-Masterpost",
        summary: "Review-first Queue-Eintrag",
        origin: "dossier_masterpost",
        originLabel: "Dossier-Masterpost",
        status: "needs_review",
        statusLabel: "Review erforderlich",
        statusDescription: "Review-first-Verteilung ohne Auto-Publish.",
        targetType: "dossier",
        targetLabel: "Dossier-Studio",
        targetHref: "/dossier/dossier_demo_mobility_berlin/studio",
        dossierId: "dossier_demo_mobility_berlin",
        sourceHref: "/dossier/dossier_demo_mobility_berlin",
        anlassraumHref: null,
        swipesHref: null,
        channels: ["website_update", "newsletter_draft"],
        reviewRequired: true,
        reviewHint: "Bitte erst prüfen.",
        riskHint: "Kein Auto-Publish.",
        nextAction: "Review markieren",
        exportReady: true,
        schedulingReady: true,
        copyReady: true,
        payloadAvailable: true,
        derived: false,
        channelConnections: [],
        scheduler: [],
        updatedAt: "2026-06-28T00:00:00.000Z",
      },
    ],
  })),
}));

vi.mock("@features/outputEngine", async () => {
  const actual = await vi.importActual<typeof import("@features/outputEngine")>(
    "@features/outputEngine",
  );
  return {
    ...actual,
    loadSocialDistributionQueueReadModel: (...args: unknown[]) =>
      mocks.loadSocialDistributionQueueReadModel(...args),
  };
});

import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

describe("dossier studio social queue contract", () => {
  beforeEach(() => {
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    setSocialDistributionRepoForTests(createInMemorySocialDistributionRepo());
    mocks.loadSocialDistributionQueueReadModel.mockResolvedValue({
      generatedAt: "2026-06-28T00:00:00.000Z",
      summary: {
        total: 1,
        reviewOpen: 1,
        queued: 0,
        scheduledReady: 0,
        exported: 0,
        blocked: 0,
      },
      guardrails: {
        noAutoPublish: true,
        noOauthConnectors: true,
        noOfficialClaim: true,
        derivedQueue: true,
      },
      items: [
        {
          id: "queue-item-1",
          title: "Dossier-Masterpost",
          summary: "Review-first Queue-Eintrag",
          origin: "dossier_masterpost",
          originLabel: "Dossier-Masterpost",
          status: "needs_review",
          statusLabel: "Review erforderlich",
          statusDescription: "Review-first-Verteilung ohne Auto-Publish.",
          targetType: "dossier",
          targetLabel: "Dossier-Studio",
          targetHref: "/dossier/dossier_demo_mobility_berlin/studio",
          dossierId: "dossier_demo_mobility_berlin",
          sourceHref: "/dossier/dossier_demo_mobility_berlin",
          anlassraumHref: null,
          swipesHref: null,
          channels: ["website_update", "newsletter_draft"],
          reviewRequired: true,
          reviewHint: "Bitte erst prüfen.",
          riskHint: "Kein Auto-Publish.",
          nextAction: "Review markieren",
          exportReady: true,
          schedulingReady: true,
          copyReady: true,
          payloadAvailable: true,
          derived: false,
          channelConnections: [],
          scheduler: [],
          updatedAt: "2026-06-28T00:00:00.000Z",
        },
      ],
    });
  });

  it("shows queue, export and scheduling readiness without live-publish claims", async () => {
    const html = renderToStaticMarkup(
      await DossierOutputStudioPage({
        params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
      }),
    );

    expect(html).toContain("Queue &amp; nächste Schritte");
    expect(html).toContain("JSON-Export kopieren");
    expect(html).toContain("In Queue setzen");
    expect(html).toContain("Als Planung bereit markieren");
    expect(html).toContain("Als kopiert markieren");
    expect(html).toContain("CI-Ausgaben");
    expect(html).not.toContain("Live posten");
    expect(html).not.toContain("OAuth");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });
});
