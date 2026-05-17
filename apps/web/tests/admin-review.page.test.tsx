import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
  buildReviewQueueReadModel: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

vi.mock("@features/reviewQueue", () => ({
  buildReviewQueueReadModel: (...args: unknown[]) => mocks.buildReviewQueueReadModel(...args),
}));

import AdminReviewPage from "@/app/admin/review/page";

describe("/admin/review page", () => {
  it("renders the central review queue with clear guardrails", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.buildReviewQueueReadModel.mockResolvedValue({
      items: [
        {
          id: "public_official_approval:signal:1",
          domain: "public_official_approval",
          domainLabel: "Amtliche Freigabe",
          workflowState: "official_approval_required",
          workflowLabel: "Amtliche Freigabe prüfen",
          title: "Sanierungsbedarf an Schulen ist bestätigt",
          summary: "Expliziter menschlicher Freigabeschritt.",
          href: "/admin/region?regionId=bezirk-berlin-reinickendorf",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: null,
          dossierId: null,
          draftId: null,
          sourceType: "public_claim",
          visibilityState: "public_reviewed",
          visibilityLabel: "geprüft",
          createdAt: "2026-05-17T09:00:00.000Z",
          updatedAt: "2026-05-17T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: true,
          reviewAuthority: "publication_approved_or_admin",
          reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
        },
      ],
      summary: {
        total: 1,
        officialApprovalCount: 1,
        byDomain: [
          {
            domain: "region_source_result",
            label: "Quellen-Testresultat",
            count: 1,
          },
          {
            domain: "region_intelligence_suggestion",
            label: "Region-Intelligence-Vorschlag",
            count: 1,
          },
          {
            domain: "public_official_approval",
            label: "Amtliche Freigabe",
            count: 1,
          },
        ],
      },
      guardrails: {
        noBulkApprove: true,
        noAutoOfficialClaim: true,
        noAutoPublish: true,
        noAutoDossierFinalization: true,
        noAutoAnlassraumFinalization: true,
      },
    });

    const html = renderToStaticMarkup(await AdminReviewPage());

    expect(html).toContain("Zentrale Review-Queue");
    expect(html).toContain("Keine Sammelentscheidung");
    expect(html).toContain("Region-Intelligence-Vorschläge");
    expect(html).toContain("reviewpflichtige Source Results");
    expect(html).toContain("Amtliche Freigabe");
    expect(html).toContain("Nur Publikationsfreigabe oder Admin-Fallback");
    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Prüfen");
  });
});
