import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing private package prices contract", () => {
  it("shows the final private price logic in DE", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("eDebatte Interessiert");
    expect(html).toContain("Beteiligung frei: 0 €");
    expect(html).toContain("Interessiert: 3,99 €");
    expect(html).toContain("eDebatte Aktiv");
    expect(html).toContain("9,99 €");
    expect(html).toContain("eDebatte Mitgestaltend");
    expect(html).toContain("29,99 €");
  });

  it("shows the final private price logic in EN", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { lang: "en" } }));

    expect(html).toContain("eDebatte Interested");
    expect(html).toContain("Participation Free: €0");
    expect(html).toContain("Interested: €3.99");
    expect(html).toContain("eDebatte Active");
    expect(html).toContain("€9.99");
    expect(html).toContain("eDebatte Co-creating");
    expect(html).toContain("€29.99");
  });
});
