import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderInstitutionPage(params?: Record<string, string>) {
  const element = await InstitutionalPricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("/pricing/institutionen i18n guided flow contract", () => {
  it("renders EN guided recommendation flow without DE fallback copy", async () => {
    const html = await renderInstitutionPage({ lang: "en" });

    expect(html).toContain("Institutional conditions");
    expect(html).toContain("1. Who are you?");
    expect(html).toContain("2. What is your primary goal?");
    expect(html).toContain("3. What is your operating frame?");
    expect(html).toContain("Participation office / agency / organization");
    expect(html).toContain("Recommended configuration");
    expect(html).toContain("Apply recommendation");
    expect(html).toContain("Request quote");
    expect(html).toContain("Request conversation");

    expect(html).not.toContain("Technisches Mapping");
    expect(html).not.toContain("citizenBasic");
    expect(html).not.toContain("citizenPremium");
    expect(html).not.toContain("citizenPro");
  });

  it("preserves EN locale on guided-state links and handoff CTAs", async () => {
    const html = await renderInstitutionPage({ lang: "en", segment: "kommunen" });

    expect(html).toContain('href="/pricing?lang=en"');
    expect(html).toContain("lang=en#guided-selection");
    expect(html).toContain('href="/order?segment=kommunen&amp;paket=b2g_basis');
    expect(html).toContain("lang=en");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("mailto:sales@edebatte.org");
  });
});
