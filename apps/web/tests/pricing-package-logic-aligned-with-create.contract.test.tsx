import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getPackagesForJourneySegment } from "@features/pricing";
import PricingPage from "@/app/pricing/page";

async function renderPricing(params?: Record<string, string>) {
  const element = await PricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("pricing package logic aligned with create", () => {
  it("keeps the three private packages mapped to create verbs in DE", async () => {
    const html = await renderPricing();
    const packages = getPackagesForJourneySegment("privat", "de");

    expect(html).toContain("Interessiert");
    expect(html).toContain("Aktiv");
    expect(html).toContain("Mitgestaltend");
    expect(html).toContain("Beitragen");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Entwerfen");

    const basis = packages.find((pkg) => pkg.id === "basis");
    const start = packages.find((pkg) => pkg.id === "start");
    const pro = packages.find((pkg) => pkg.id === "pro");

    expect(basis?.wofuerGedacht).toContain("Beitragen");
    expect(start?.wofuerGedacht).toContain("Prüfen");
    expect(pro?.wofuerGedacht).toContain("Entwerfen");
  });

  it("keeps the three private packages mapped to create verbs in EN", async () => {
    const html = await renderPricing({ lang: "en" });
    const packages = getPackagesForJourneySegment("privat", "en");

    expect(html).toContain("Interested");
    expect(html).toContain("Active");
    expect(html).toContain("Co-creating");
    expect(html).toContain("Contribute");
    expect(html).toContain("Review");
    expect(html).toContain("Draft");

    const basis = packages.find((pkg) => pkg.id === "basis");
    const start = packages.find((pkg) => pkg.id === "start");
    const pro = packages.find((pkg) => pkg.id === "pro");

    expect(basis?.wofuerGedacht).toContain("Contribute");
    expect(start?.wofuerGedacht).toContain("Review");
    expect(pro?.wofuerGedacht).toContain("Draft together");
  });
});
