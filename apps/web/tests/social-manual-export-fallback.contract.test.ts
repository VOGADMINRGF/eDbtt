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
      total: 0,
      reviewOpen: 0,
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
    items: [],
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

async function renderStudio() {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
  });
  return renderToStaticMarkup(element);
}

describe("social-manual-export-fallback.contract", () => {
  beforeEach(() => {
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    setSocialDistributionRepoForTests(createInMemorySocialDistributionRepo());
    mocks.loadSocialDistributionQueueReadModel.mockResolvedValue({
      generatedAt: "2026-06-28T00:00:00.000Z",
      summary: {
        total: 0,
        reviewOpen: 0,
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
      items: [],
    });
  });

  it("keeps manual export as the honest fallback when no connector is configured", async () => {
    const html = await renderStudio();

    expect(html).toContain("Connector- und Scheduler-Status");
    expect(html).toContain("manueller Export der Fallback");
    expect(html).toContain("Noch kein persistierter Queue-Eintrag vorhanden");
    expect(html).toContain("Kein Auto-Publish");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });
});
