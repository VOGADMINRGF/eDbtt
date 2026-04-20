import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-private-member-price.contract", () => {
  it("shows private member pricing and initiative contribution guidance on /pricing", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("0 € für VoiceOpenGov-Mitglieder");
    expect(html).toContain("3,99 € regulär");
    expect(html).toContain("9,90 €");
    expect(html).toContain("29,90 €");
    expect(html).toContain("Empfohlen sind 5,63 €");
  });
});
