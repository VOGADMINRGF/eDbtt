import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getPackagesForJourneySegment } from "@features/pricing";
import PricingPage from "@/app/pricing/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import VormerkenPage from "@/app/vormerken/page";

describe("pricing/vormerken package source of truth", () => {
  it("renders private package titles from the same shared package source on both pages", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);

    const privatePackages = getPackagesForJourneySegment("privat");
    privatePackages.forEach((pkg) => {
      expect(pricingHtml).toContain(pkg.titel);
      expect(vormerkenHtml).toContain(pkg.titel);
    });
  });

  it("keeps institutional secondary route aligned across both pages", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);

    expect(pricingHtml).toContain("/pricing/institutionen");
    expect(vormerkenHtml).toContain("/pricing/institutionen");
  });
});
