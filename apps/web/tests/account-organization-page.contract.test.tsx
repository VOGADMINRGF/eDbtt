import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getPricingEntryTrustCopy } from "@features/pricing";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
  getSessionUser: vi.fn(),
  listOrganizationClaimsForUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@features/region", () => ({
  getRegionOrganizationRuntimeRepo: () => ({
    listOrganizationClaimsForUser: (...args: unknown[]) => mocks.listOrganizationClaimsForUser(...args),
  }),
}));

import AccountOrganizationPage from "@/app/account/organization/page";

const DE_TRUST = getPricingEntryTrustCopy("de");

describe("/account/organization page contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({
      _id: {
        toHexString: () => "user-1",
      },
      sessionValid: true,
    });
    mocks.listOrganizationClaimsForUser.mockResolvedValue([]);
  });

  it("keeps free civic participation separate from org activation and claims", async () => {
    const html = renderToStaticMarkup(await AccountOrganizationPage());

    expect(html).toContain(DE_TRUST.freeCorePromise);
    expect(html).toContain(DE_TRUST.organizationScopeOnly);
    expect(html).toContain(DE_TRUST.noHiddenAiCosts);
    expect(html).toContain("Dieser Antrag dient nur bewusstem Org-Scope, Rollen und Freischaltungen.");
  });
});
