import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-initiative-link.contract", () => {
  it("links from /pricing to initiative context with clear wording", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Zur Initiative");
    expect(html).toContain('href="/howtoworks/initiative"');
    expect(html).not.toContain("Zur Bewegung");
  });
});
