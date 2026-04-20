import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

async function renderPricing(params?: Record<string, string>) {
  const element = await PricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("/pricing i18n contract", () => {
  it("renders DE and EN with the same three-package logic", async () => {
    const de = await renderPricing();
    const en = await renderPricing({ lang: "en" });

    expect(de).toContain("eDebatte Interessiert");
    expect(de).toContain("0 € für VoiceOpenGov-Mitglieder");
    expect(de).toContain("29,90 €");

    expect(en).toContain("eDebatte Interested");
    expect(en).toContain("€0 for VoiceOpenGov members");
    expect(en).toContain("€29.90");

    expect(en).not.toContain("Technisches Mapping");
    expect(en).not.toContain("citizenBasic");
    expect(en).not.toContain("citizenPremium");
    expect(en).not.toContain("citizenPro");
  });

  it("keeps locale-aware routes on primary and institutional CTAs", async () => {
    const html = await renderPricing({ lang: "en", segment: "organisationen" });

    expect(html).toContain('href="/pricing/institutionen?lang=en"');
    expect(html).toContain('href="/order?paket=basis&amp;lang=en"');
    expect(html).toContain('href="/order?paket=pro&amp;lang=en"');
  });
});
