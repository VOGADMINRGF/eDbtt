import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-main-page-simplified-decision-flow.contract", () => {
  it("keeps /pricing as a short private decision page", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Pakete &amp; Preise");
    expect(html).toContain("Paket wählen");
    expect(html).toContain("Professionell nutzen");

    const heroIndex = html.indexOf("Pakete &amp; Preise");
    const packageIndex = html.indexOf("eDebatte Interessiert");
    const membershipIndex = html.indexOf("Mitgliedschaft in der Initiative");

    expect(packageIndex).toBeGreaterThan(heroIndex);
    expect(membershipIndex).toBeGreaterThan(packageIndex);
  });
});
