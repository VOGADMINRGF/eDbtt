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

describe("operator console page contract", () => {
  it("renders a calm operator landing over existing admin routes", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      sessionValid: true,
      roles: ["admin"],
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.buildOperatorConsoleReadModel.mockResolvedValue({
      generatedAt: "2026-05-27T12:00:00.000Z",
      hero: {
        openOperatorTasks: 12,
        sourceFailures: 2,
        waitingMaterialJobs: 3,
        pendingDossierUpdates: 4,
        socialQueueReviewOpen: 1,
      },
      nextActions: [
        {
          label: "Review Queue öffnen",
          href: "/admin/review",
          description: "Zentrale Review-Aufgaben zuerst bearbeiten.",
          sourceArea: "review_queue",
          priority: 100,
        },
        {
          label: "Pricing Orders öffnen",
          href: "/admin/pricing/orders",
          description: "Offene Vertrags- oder Checkout-Prüfungen prüfen.",
          sourceArea: "payments",
          priority: 70,
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
          summary: "12 offene Aufgaben, 3 mit hoher Priorität.",
          metrics: [
            { label: "Offen", value: 12 },
            { label: "Hohe Priorität", value: 3 },
            { label: "Bereit", value: 5 },
          ],
          guardrail: "Kein Auto-Publish.",
        },
        {
          key: "payments",
          title: "Payment & Entitlements",
          href: "/admin/pricing/orders",
          actionLabel: "Pricing Orders öffnen",
          state: "review",
          stateLabel: "Review läuft",
          summary: "1 Order wartet auf Prüfung.",
          metrics: [
            { label: "Orders in Prüfung", value: 1 },
            { label: "Aktive Freischaltungen", value: 2 },
            { label: "Checkout-bezogen", value: 1 },
          ],
          guardrail: "Keine versteckten Providerpfade.",
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

    expect(html).toContain("Steuerzentrale");
    expect(html).toContain("Betreiber-Modus aktiv");
    expect(html).toContain("Ruhige Operator-Konsole");
    expect(html).toContain("Nächste sichere Schritte");
    expect(html).toContain("Review Queue öffnen");
    expect(html).toContain("/admin/review");
    expect(html).toContain("Pricing Orders");
    expect(html).toContain("/admin/pricing/orders");
    expect(html).toContain("Graph Repairs (aktiv)");
    expect(html).toContain("/account/organization/dashboard");
  });
});
