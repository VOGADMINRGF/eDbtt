import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

describe("pricing-no-hidden-ai-costs.contract", () => {
  it("states hidden AI costs are not part of the basic pricing promise", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage());
    const institutionalHtml = renderToStaticMarkup(
      await InstitutionalPricingPage({ searchParams: { segment: "organisationen" } }),
    );

    expect(pricingHtml).toContain("Keine versteckten AI-Kosten");
    expect(pricingHtml).toContain("Self-Service-Checkout erscheint nur");
    expect(institutionalHtml).toContain("Self-Service-Checkout erscheint nur");
    expect(institutionalHtml).toContain("manuelle Rechnung");
    expect(pricingHtml).not.toContain("automatisch berechnet");
  });
});
