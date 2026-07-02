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

describe("v3 handoff linkage map admin page", () => {
  it("renders the handoff linkage map on /admin without fake actions", async () => {
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

    expect(html).toContain("Handoff Integrity &amp; Linkage Map");
    expect(html).toContain("Create / Analyze / Claims");
    expect(html).toContain("Editorial Review Queue");
    expect(html).toContain("-&gt;");
    expect(html).toContain("wired");
    expect(html).toContain("Linkage zeigt Verbindungen, keine Wahrheit, keine automatische Veröffentlichung.");
    expect(html).toContain("Kritische nächste Lücken");
    expect(html).toContain("Programm Candidate Pipeline");
    expect(html).toContain("Social / Output Drafts");
    expect(html).toContain("QR / Sharing Integrity");
    expect(html).toContain("Live / Claims Follow-up");
    expect(html).toContain("Meeting Link Integration optional");
    expect(html).toContain("Folgepfad offen");
    expect(html).toContain("/admin/review");
    expect(html).toContain("/qr-studio");
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain("Auto veröffentlichen");
    expect(html).not.toContain("Programm automatisch freigeben");
    expect(html).not.toContain("Jetzt live posten");
  });
});
