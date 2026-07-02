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

describe("v3 deepsearch cost governance admin page", () => {
  it("renders the governance section on /admin without adding a new runtime path", async () => {
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

    expect(html).toContain("V3 DeepSearch / Research Cost Governance");
    expect(html).toContain("Bestehende Cost Gates ehrlich zusammenziehen");
    expect(html).toContain("Research / DeepSearch Request Gate");
    expect(html).toContain("Hidden DeepSearch Fallback Block");
    expect(html).toContain("Material Extraction Cost Gate");
    expect(html).toContain("AI Usage Threshold Visibility");
    expect(html).toContain("Export / Social Output Review Gate");
    expect(html).toContain("Per-run Consumption Truth");
    expect(html).toContain("missing_runtime_truth");
    expect(html).toContain("/admin/telemetry/ai/usage");
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain("Auto veröffentlichen");
  });
});
