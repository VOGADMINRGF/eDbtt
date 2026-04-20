import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-mobile-decision-hierarchy.contract", () => {
  it("keeps mobile-first decision hierarchy without extra horizontal-heavy middle layout", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain('data-product-surface-shell="true"');
    expect(html).toContain("grid items-stretch gap-6");
    expect(html).toContain("scroll-mt-28");

    expect(html).not.toContain("sm:grid-cols-3");
    expect(html).not.toContain("Was du konkret machen kannst");
  });
});
