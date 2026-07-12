import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderInstitutionalPricing(params?: Record<string, string>) {
  return renderToStaticMarkup(await InstitutionalPricingPage({ searchParams: params }));
}

describe("pricing institutional trust copy contract", () => {
  it("keeps free civic core and deliberate activation visible on /pricing/institutionen", async () => {
    const html = await renderInstitutionalPricing({ segment: "organisationen" });

    expect(html).toContain("Lesen, Swipes und Grundbeteiligung bleiben frei.");
    expect(html).toContain("Self-Service-Checkout erscheint nur");
    expect(html).toContain("Keine versteckten AI-Kosten");
  });

  it("keeps the same trust promise in EN without DE fallback", async () => {
    const html = await renderInstitutionalPricing({ lang: "en", segment: "kommunen" });

    expect(html).toContain("Reading, swipes and basic participation stay free.");
    expect(html).toContain("No hidden AI costs");
    expect(html).not.toContain("Lesen, Swipes und Grundbeteiligung bleiben frei.");
  });
});
