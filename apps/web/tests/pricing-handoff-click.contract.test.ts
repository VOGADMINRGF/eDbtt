import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";
import { PRICING_PATH_CONTRACT } from "@features/pricing";

describe("pricing handoff click contract", () => {
  it("keeps kommunen bridge CTAs clickable toward canonical B2G configurator", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "kommunen" } }));

    expect(html).toContain('/pricing/institutionen?segment=kommunen#guided-selection');
    expect(html).toContain('/pricing/institutionen?segment=kommunen&amp;goal=oeffentliche_anschlussfaehigkeit&amp;frame=laufender_betrieb#guided-selection');
  });

  it("keeps package CTAs segment-stable for organization entry", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "organisationen" } }));

    expect(html).toContain(
      `href="${PRICING_PATH_CONTRACT.primaryOrderPath}?paket=b2b_basis&amp;segment=organisationen"`,
    );
    expect(html).toContain(
      `href="${PRICING_PATH_CONTRACT.primaryOrderPath}?paket=b2b_pro&amp;segment=organisationen"`,
    );
  });

  it("keeps municipal institutional CTAs with package and completion context", async () => {
    const html = renderToStaticMarkup(
      await InstitutionalPricingPage({
        searchParams: {
          segment: "kommunen",
        },
      }),
    );

    expect(html).toContain("segment=kommunen");
    expect(html).toContain("paket=b2g_basis");
    expect(html).toContain("paket=b2g_pro");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("completion=conversation_request");
    expect(html).not.toContain('href="#"');
  });
});
