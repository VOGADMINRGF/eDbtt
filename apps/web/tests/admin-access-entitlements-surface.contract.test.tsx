import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PRODUCTION_ENTRY_COPY } from "@/features/access/productionEntryContract";

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(() => true),
  listEntitlementsForAdmin: vi.fn(),
  listOrganizationClaimsForReview: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mocks.searchParams,
  redirect: (href: string) => mocks.redirect(href),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<object>("@features/region");
  return {
    ...actual,
    getRegionEntitlementRuntimeRepo: () => ({
      listEntitlementsForAdmin: (...args: unknown[]) => mocks.listEntitlementsForAdmin(...args),
    }),
    getRegionOrganizationRuntimeRepo: () => ({
      listOrganizationClaimsForReview: (...args: unknown[]) => mocks.listOrganizationClaimsForReview(...args),
    }),
  };
});

import AccessCenterPage from "@/app/admin/access/page";
import AdminEntitlementsPage from "@/app/admin/entitlements/page";

describe("admin access and entitlements surface contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.getSessionUser.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
      sessionValid: true,
    });
    mocks.listEntitlementsForAdmin.mockResolvedValue([]);
    mocks.listOrganizationClaimsForReview.mockResolvedValue([]);
  });

  it("keeps access-center wording aligned with separated role, membership and entitlement truth", () => {
    const html = renderToStaticMarkup(<AccessCenterPage />);

    expect(html).toContain("Seitenzugriffe verwalten");
    expect(html).toContain(PRODUCTION_ENTRY_COPY.adminAccessLead);
  });

  it("keeps entitlements page explicit about review-first activation without billing promises", async () => {
    const html = renderToStaticMarkup(await AdminEntitlementsPage());

    expect(html).toContain("Freischaltungen verwalten");
    expect(html).toContain(PRODUCTION_ENTRY_COPY.adminEntitlementsLead);
  });
});
