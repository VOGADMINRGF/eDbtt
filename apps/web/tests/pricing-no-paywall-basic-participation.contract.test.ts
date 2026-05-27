import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-no-paywall-basic-participation.contract", () => {
  it("keeps reading, swipes and basic participation clearly free", async () => {
    const html = renderToStaticMarkup(await PricingPage());

    expect(html).toContain("Du kannst eDebatte kostenlos nutzen");
    expect(html).toContain("Beteiligung frei: 0 €");
    expect(html).toContain("Abstimmung und Teilnahme bleiben kostenfrei");
    expect(html).toContain("Kostenfrei teilnehmen");
    expect(html).not.toContain("Paywall für Grundbeteiligung");
  });
});
