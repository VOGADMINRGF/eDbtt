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

describe("studio distribution panel contract", () => {
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

  it("keeps review-first planning sections and no live-publish controls", async () => {
    const html = await renderStudio();

    expect(html).toContain("Fertiger Post-Entwurf");
    expect(html).toContain("Kanäle auswählen");
    expect(html).toContain("Kanalverbindungen");
    expect(html).toContain("Verteilung planen");
    expect(html).toContain("Admin: Kanal-Konfiguration &amp; Review-Routing");
    expect(html).toContain("QR-/Print-Vorschau");
    expect(html).toContain("Text kopieren");
    expect(html).toContain("Entwurf erstellen");
    expect(html).toContain("Verteilung vorbereiten");
    expect(html).toContain("LocalStorage-Arbeitsstände bleiben lokal im Browser");
    expect(html).toContain("Browser-Arbeitsstände werden nur lokal gespeichert.");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Live posten");
  });
});
