import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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

    expect(html).toContain("Öffentliche Grundbeteiligung mit Lesen, Swipes und allgemeinen Hinweisen bleibt frei.");
    expect(html).toContain("Diese Seite ist nur für bewusste Organisations-Claims, Rollen und Freischaltungen.");
    expect(html).toContain("Kein verpflichtender Checkout und keine versteckten AI-Kosten.");
    expect(html).toContain("Dieser Antrag dient nur bewusstem Org-Scope, Rollen und Freischaltungen.");
    expect(html).toContain("Keine versteckten AI-Kosten: zusätzliche Recherche-, Review- oder Aktivierungspfade werden nur bewusst aktiviert.");
  });
});
