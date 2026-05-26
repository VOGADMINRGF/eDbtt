import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  listRundenEntryItems: vi.fn(),
  readSession: vi.fn(),
  resolveCurrentRequestScopeContext: vi.fn(),
  buildOrganizationDashboardReadModel: vi.fn(),
}));

vi.mock("@features/topicRound/entrySource", () => ({
  listRundenEntryItems: (...args: unknown[]) => mocks.listRundenEntryItems(...args),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveCurrentRequestScopeContext: (...args: unknown[]) =>
    mocks.resolveCurrentRequestScopeContext(...args),
  requestScopeCanManageOrganizationVisibility: () => false,
  requestScopeCanWriteOrganizationRoutes: () => false,
}));

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<object>("@features/region");
  return {
    ...actual,
    buildOrganizationDashboardReadModel: (...args: unknown[]) =>
      mocks.buildOrganizationDashboardReadModel(...args),
    organizationEntitlementAllowsScope: () => false,
    organizationContractAllowsProvisionedScope: () => false,
  };
});

import RundenPage from "@/app/runden/page";

describe("stream and Anlassraum linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue(null);
    mocks.resolveCurrentRequestScopeContext.mockResolvedValue(null);
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(null);
  });

  it("shows the live/event participation link on public Anlassraum cards", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "seed-1",
        anlassraumId: "65f000000000000000000401",
        ownerType: "community",
        ownerId: "org-1",
        stewardUserId: null,
        createdBy: null,
        isPublic: true,
        title: "Anlassraum Energie Berlin",
        summary: "Öffentliche Folgefläche",
        topicKey: "energie-berlin",
        anlassraumType: "event",
        sourceMode: "manual",
        anlassraumStatus: "active",
        outputStatus: "ready",
        reviewState: "approved",
        publishTarget: "/runden?anlassraumId=65f000000000000000000401",
        intakeHref: "/create?anlassraumId=65f000000000000000000401",
        operatingHref: "/runden?anlassraumId=65f000000000000000000401",
        resultsHref: "/dossier/65f000000000000000000777",
        entryHref: "/runden?anlassraumId=65f000000000000000000401",
        lifecycle: "active",
        productionState: "active",
        productionStateLabel: "Als Vorschlag sichtbar",
        publicShareState: "share_active",
        publicShareHint: "Link und QR sind aktiv.",
        finished: false,
        finishedAt: null,
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: false,
        sourceKind: "output_seed_with_anlassraum",
        shareActions: null,
        relatedDossierHref: "/dossier/65f000000000000000000777",
        relatedDossierUpdateLabel: "Dossier-Kontext aktiv",
        relatedDossierUpdatedAt: "2026-05-25T20:00:00.000Z",
        relatedTopicPageHref: null,
        relatedTopicPageTitle: null,
        relatedTopicPageVisibilityLabel: null,
        relatedStreamHref: "/stream/stadtwerke-live-berlin",
        relatedStreamTitle: "Livestream Stadtwerke Berlin",
        relatedStreamStatusLabel: "Fragen möglich",
      },
    ]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Live-/Event-Beteiligung");
    expect(html).toContain("Livestream Stadtwerke Berlin");
    expect(html).toContain("Fragen möglich");
    expect(html).toContain('href="/stream/stadtwerke-live-berlin"');
  });
});
