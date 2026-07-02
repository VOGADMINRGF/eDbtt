import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
  buildOperatorConsoleReadModel: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

vi.mock("@/features/admin/operatorConsoleReadModel", () => {
  return {
    buildOperatorConsoleReadModel: (...args: unknown[]) => mocks.buildOperatorConsoleReadModel(...args),
  };
});

import AdminDashboardPage from "@/app/admin/page";

describe("v3 test regression matrix admin page", () => {
  it("renders the test matrix on /admin without fake test actions", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      sessionValid: true,
      roles: ["admin"],
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.buildOperatorConsoleReadModel.mockResolvedValue({
      generatedAt: "2026-07-02T12:00:00.000Z",
      hero: {
        openOperatorTasks: 5,
        sourceFailures: 1,
        waitingMaterialJobs: 2,
        pendingDossierUpdates: 3,
        socialQueueReviewOpen: 1,
      },
      nextActions: [
        {
          label: "Review Queue öffnen",
          href: "/admin/review",
          description: "Offene Review-Arbeit zuerst bearbeiten.",
          sourceArea: "review_queue",
          priority: 100,
        },
      ],
      areas: [
        {
          key: "review_queue",
          title: "Review Queue",
          href: "/admin/review",
          actionLabel: "Review Queue öffnen",
          state: "attention",
          stateLabel: "Braucht Eingriff",
          summary: "5 offene Aufgaben.",
          metrics: [
            { label: "Offen", value: 5 },
            { label: "Hohe Priorität", value: 2 },
            { label: "Bereit", value: 3 },
          ],
          guardrail: "Kein Auto-Publish.",
        },
      ],
      guardrails: {
        noNewBackend: true,
        noFakeActions: true,
        reviewFirst: true,
        noAutoPublish: true,
        noSecretProviderClaims: true,
      },
    });

    const html = renderToStaticMarkup(await AdminDashboardPage());

    expect(html).toContain("V3 Test &amp; Regression Matrix");
    expect(html).toContain("Testabdeckung ist Voraussetzung für endstate_ready");
    expect(html).toContain("Kritische Testlücken");
    expect(html).toContain("External Browser E2E");
    expect(html).toContain("Programm Candidate Pipeline");
    expect(html).toContain("Social Output Drafts");
    expect(html).toContain("Live / Claims Follow-up");
    expect(html).toContain("Notifications / Incident / Recovery");
    expect(html).toContain("Pricing / Credit Consumption Truth");
    expect(html).toContain("covered");
    expect(html).toContain("partially_covered");
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain("Tests jetzt ausführen");
    expect(html).not.toContain("Auto veröffentlichen");
  });
});
