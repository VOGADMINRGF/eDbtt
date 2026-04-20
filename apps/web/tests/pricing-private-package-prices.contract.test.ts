import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing private package prices contract", () => {
  it("shows the final private price logic in DE", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("eDebatte Interessiert");
    expect(html).toContain("0 € für VoiceOpenGov-Mitglieder");
    expect(html).toContain("3,99 € regulär");
    expect(html).toContain("eDebatte Aktiv");
    expect(html).toContain("9,90 €");
    expect(html).toContain("eDebatte Mitgestaltend");
    expect(html).toContain("29,90 €");
  });

  it("shows the final private price logic in EN", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { lang: "en" } }));

    expect(html).toContain("eDebatte Interested");
    expect(html).toContain("€0 for VoiceOpenGov members");
    expect(html).toContain("€3.99 regular");
    expect(html).toContain("eDebatte Active");
    expect(html).toContain("€9.90");
    expect(html).toContain("eDebatte Co-creating");
    expect(html).toContain("€29.90");
  });
});
