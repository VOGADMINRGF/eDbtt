import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  listRundenEntryItems: vi.fn(),
  readSession: vi.fn(),
  resolveCurrentRequestScopeContext: vi.fn(),
  requestScopeCanManageOrganizationVisibility: vi.fn(),
  requestScopeCanWriteOrganizationRoutes: vi.fn(),
  buildOrganizationDashboardReadModel: vi.fn(),
  organizationEntitlementAllowsScope: vi.fn(),
  organizationContractAllowsProvisionedScope: vi.fn(),
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
  requestScopeCanManageOrganizationVisibility: (...args: unknown[]) =>
    mocks.requestScopeCanManageOrganizationVisibility(...args),
  requestScopeCanWriteOrganizationRoutes: (...args: unknown[]) =>
    mocks.requestScopeCanWriteOrganizationRoutes(...args),
}));

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<typeof import("@features/region")>("@features/region");
  return {
    ...actual,
    buildOrganizationDashboardReadModel: (...args: unknown[]) =>
      mocks.buildOrganizationDashboardReadModel(...args),
    organizationEntitlementAllowsScope: (...args: unknown[]) =>
      mocks.organizationEntitlementAllowsScope(...args),
    organizationContractAllowsProvisionedScope: (...args: unknown[]) =>
      mocks.organizationContractAllowsProvisionedScope(...args),
  };
});

import RundenPage from "@/app/runden/page";

describe("runden working surface copy contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({
      uid: "65f000000000000000000301",
      roles: ["creator"],
    });
    mocks.resolveCurrentRequestScopeContext.mockResolvedValue(null);
    mocks.requestScopeCanManageOrganizationVisibility.mockReturnValue(false);
    mocks.requestScopeCanWriteOrganizationRoutes.mockReturnValue(false);
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(null);
    mocks.organizationEntitlementAllowsScope.mockReturnValue(false);
    mocks.organizationContractAllowsProvisionedScope.mockReturnValue(false);
  });

  it("keeps /runden framed as an Anlassraum working surface instead of admin language", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "seed-1",
        anlassraumId: "65f000000000000000000311",
        isPublic: true,
        title: "Mobilität Innenstadt",
        summary: "Laufender Anlass",
        topicKey: "mobility",
        anlassraumType: "policy",
        sourceMode: "feed",
        anlassraumStatus: "active",
        outputStatus: "review",
        reviewState: "pending",
        publishTarget: "/round/mobilitaet",
        intakeHref: "/create?mode=source&anlassraumId=65f000000000000000000311",
        operatingHref: "/round/mobilitaet?anlassraumId=65f000000000000000000311",
        resultsHref: null,
        entryHref: "/round/mobilitaet?anlassraumId=65f000000000000000000311",
        lifecycle: "active",
        finished: false,
        finishedAt: null,
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: false,
        sourceKind: "output_seed_with_anlassraum",
        shareActions: {
          contextKind: "runde",
          primaryTargetKind: "round_operating_target",
          canonicalTarget: "/round/mobilitaet?anlassraumId=65f000000000000000000311",
          qrTarget: "/round/mobilitaet?anlassraumId=65f000000000000000000311",
          shareTitle: "Mobilität Innenstadt",
          sharePrompt: "Laufenden Anlass teilen",
          shareSummary: "Zusammenfassung",
          socialCandidate: false,
          needsReviewBeforeOfficialSocial: true,
        },
      },
    ]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Anlässe führen");
    expect(html).toContain("Anlassräume");
    expect(html).toContain("Laufende Anlässe");
    expect(html).toContain("Empfohlener Anlass");
    expect(html).toContain("Stand weiterführen");
    expect(html).toContain("Beitrag vorbereiten");
    expect(html).toContain("Per QR/Link teilnehmen");
    expect(html).toContain("QR und Verteilung stehen für berechtigte Rollen");

    expect(html).not.toContain("Verwalten");
    expect(html).not.toContain(">Ansicht<");
  });
});
