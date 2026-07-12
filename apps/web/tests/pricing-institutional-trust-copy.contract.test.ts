import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";
import { getPricingEntryTrustCopy } from "@features/pricing";

const DE_TRUST = getPricingEntryTrustCopy("de");
const EN_TRUST = getPricingEntryTrustCopy("en");

async function renderInstitutionalPricing(params?: Record<string, string>) {
  return renderToStaticMarkup(await InstitutionalPricingPage({ searchParams: params }));
}

describe("pricing institutional trust copy contract", () => {
  it("keeps free civic core and deliberate activation visible on /pricing/institutionen", async () => {
    const html = await renderInstitutionalPricing({ segment: "organisationen" });

    expect(html).toContain(DE_TRUST.freeCorePromise);
    expect(html).toContain("Self-Service-Checkout erscheint nur");
    expect(html).toContain(DE_TRUST.noHiddenAiCosts);
  });

  it("keeps the same trust promise in EN without DE fallback", async () => {
    const html = await renderInstitutionalPricing({ lang: "en", segment: "kommunen" });

    expect(html).toContain(EN_TRUST.freeCorePromise);
    expect(html).toContain(EN_TRUST.noHiddenAiCosts);
    expect(html).not.toContain(DE_TRUST.freeCorePromise);
  });
});
