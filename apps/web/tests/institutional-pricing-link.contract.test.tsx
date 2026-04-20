import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

describe("institutional pricing link contract", () => {
  it("links /pricing and /vormerken to /pricing/institutionen", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);

    expect(pricingHtml).toContain('href="/pricing/institutionen"');
    expect(vormerkenHtml).toContain('href="/pricing/institutionen"');
  });

  it("keeps /pricing/institutionen as order-capable flow with optional contact", async () => {
    const html = renderToStaticMarkup(await InstitutionalPricingPage({}));

    expect(html).toContain('href="/order?segment=organisationen&amp;paket=b2b_basis');
    expect(html).toContain('href="/order?segment=organisationen&amp;paket=b2b_basis&amp;goal=');
    expect(html).toContain("completion=direct_order");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("mailto:sales@edebatte.org");
    expect(html).toContain("Kontakt");
  });
});
