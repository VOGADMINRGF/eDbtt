import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-initiative-link.contract", () => {
  it("links from /pricing to initiative context with clear wording", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Mehr zur Initiative");
    expect(html).toContain('href="/mitglied-werden"');
    expect(html).not.toContain("Zur Bewegung");
  });
});

