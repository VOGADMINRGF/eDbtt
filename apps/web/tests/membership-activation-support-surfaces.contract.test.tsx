import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getMembershipActivationTruth } from "@features/pricing";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: (...args: unknown[]) => mocks.cookies(...args),
}));

import AdminMembershipsPage from "@/app/admin/memberships/page";
import DashboardAdminMembershipsPage from "@/app/dashboard/admin/memberships/page";
import DashboardMembershipsPage from "@/app/dashboard/memberships/page";
import AdminPricingOrdersPage from "@/app/admin/pricing/orders/page";

const ACTIVATION_TRUTH = getMembershipActivationTruth("de");

describe("membership activation support surfaces", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mocks.cookies.mockReturnValue({
      get: (name: string) => (name === "u_id" ? { value: "user-1" } : undefined),
      getAll: () => [{ name: "u_id", value: "user-1" }],
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ items: [] }),
    }) as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("keeps /admin/memberships as manual support instead of a package activation surface", () => {
    const html = renderToStaticMarkup(<AdminMembershipsPage />);

    expect(html).toContain("Mitgliedschafts-Support");
    expect(html).toContain(ACTIVATION_TRUTH.adminMembershipSupportHint);
    expect(html).toContain(ACTIVATION_TRUTH.adminMembershipManualActionsHint);
    expect(html).toContain(ACTIVATION_TRUTH.legacySupportSurfaceHint);
    expect(html).toContain('href="/dashboard/admin/memberships"');
    expect(html).toContain('href="/admin/pricing/orders"');
    expect(html).toContain('href="/admin/entitlements"');
  });

  it("keeps /dashboard/admin/memberships as a linked support surface with manual actions only", () => {
    const html = renderToStaticMarkup(<DashboardAdminMembershipsPage />);

    expect(html).toContain("Mitgliedschaften");
    expect(html).toContain(ACTIVATION_TRUTH.adminMembershipSupportHint);
    expect(html).toContain(ACTIVATION_TRUTH.adminMembershipManualActionsHint);
    expect(html).toContain(ACTIVATION_TRUTH.legacySupportSurfaceHint);
    expect(html).toContain('href="/admin/pricing/orders"');
    expect(html).toContain('href="/admin/entitlements"');
  });

  it("keeps /dashboard/memberships framed as an internal support list", async () => {
    const html = renderToStaticMarkup(await DashboardMembershipsPage());

    expect(html).toContain("Mitgliedsanträge");
    expect(html).toContain(ACTIVATION_TRUTH.adminMembershipSupportHint);
    expect(html).toContain(ACTIVATION_TRUTH.adminMembershipManualActionsHint);
    expect(html).toContain(ACTIVATION_TRUTH.legacySupportSurfaceHint);
    expect(html).toContain('href="/admin/memberships"');
    expect(html).toContain('href="/admin/pricing/orders"');
    expect(html).toContain('href="/admin/entitlements"');
  });

  it("keeps /admin/pricing/orders review-first and separate from payment execution", () => {
    const html = renderToStaticMarkup(<AdminPricingOrdersPage />);

    expect(html).toContain("Bestellungen &amp; Freigaben");
    expect(html).toContain(ACTIVATION_TRUTH.adminOrderReviewHint);
  });
});
