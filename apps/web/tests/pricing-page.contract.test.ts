import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("/pricing canonical landing", () => {
  it("renders canonical segments and b2c core prices", () => {
    const html = renderToStaticMarkup(PricingPage());

    expect(html).toContain("Pakete &amp; Preise");
    expect(html).toContain("Privat");
    expect(html).toContain("Organisationen");
    expect(html).toContain("Kommunen / Verwaltung");
    expect(html).toContain("0 €");
    expect(html).toContain("9,99 €");
    expect(html).toContain("29 €");
    expect(html).toContain("citizenPremium");
    expect(html).toContain("citizenPro");
  });

  it("shows hybrid institutional model, add-ons, and doc examples", () => {
    const html = renderToStaticMarkup(PricingPage());

    expect(html).toContain("Base ab 2.500 € / Monat");
    expect(html).toContain("Small: 300 €");
    expect(html).toContain("Medium: 600–1.000 €");
    expect(html).toContain("Large: 1.000–1.500 €");
    expect(html).toContain("4.475 €");
    expect(html).toContain("6.825 €");
    expect(html).toContain("Event");
    expect(html).toContain("Assistenz");
    expect(html).toContain("Reports");
    expect(html).toContain("Managed Governance");
  });

  it("keeps main cta targets on existing product routes", () => {
    const html = renderToStaticMarkup(PricingPage());

    expect(html).toContain('href="/vormerken"');
    expect(html).toContain('href="/mitglied-antrag"');
    expect(html).toContain('href="/vormerken?paket=b2b_pro"');
    expect(html).toContain('href="/vormerken?paket=b2g_pro"');
  });
});
