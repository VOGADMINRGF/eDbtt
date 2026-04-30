import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-private-member-price.contract", () => {
  it("shows private package pricing and initiative contribution guidance on /pricing", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Beteiligung frei: 0 €");
    expect(html).toContain("Interessiert: 4,99 €");
    expect(html).toContain("14,99 €");
    expect(html).toContain("29,99 €");
    expect(html).toContain("Empfohlener Mitgliedsbeitrag: 5,63 €.");
  });
});
