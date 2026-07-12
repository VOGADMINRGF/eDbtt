import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import { PRICING_PATH_CONTRACT } from "@features/pricing";

async function renderPricing(params?: Record<string, string>) {
  const element = await PricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("/pricing i18n contract", () => {
  it("renders DE and EN with the same three-package logic", async () => {
    const de = await renderPricing();
    const en = await renderPricing({ lang: "en" });

    expect(de).toContain("eDebatte Interessiert");
    expect(de).toContain("Beteiligung frei: 0 €");
    expect(de).toContain("29,99 €");

    expect(en).toContain("eDebatte Interested");
    expect(en).toContain("Participation Free: €0");
    expect(en).toContain("€29.99");

    expect(en).not.toContain("Technisches Mapping");
    expect(en).not.toContain("citizenBasic");
    expect(en).not.toContain("citizenPremium");
    expect(en).not.toContain("citizenPro");
  });

  it("keeps locale-aware routes on primary and institutional CTAs", async () => {
    const html = await renderPricing({ lang: "en", segment: "organisationen" });

    expect(html).toContain('href="/pricing/institutionen?lang=en"');
    expect(html).toContain(
      `href="${PRICING_PATH_CONTRACT.primaryOrderPath}?paket=b2b_basis&amp;segment=organisationen&amp;lang=en"`,
    );
    expect(html).toContain(
      `href="${PRICING_PATH_CONTRACT.primaryOrderPath}?paket=b2b_pro&amp;segment=organisationen&amp;lang=en"`,
    );
  });
});
