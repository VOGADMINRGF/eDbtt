import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-membership-block-clarity.contract", () => {
  it("explains membership clearly and compactly", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Als Mitglied der Initiative ist das Paket „Interessiert“ kostenfrei.");
    expect(html).toContain("Regulär kostet „Interessiert“ 3,99 €.");
    expect(html).toContain("Der frei gewählte Mitgliedsbeitrag bleibt davon unabhängig.");
    expect(html).toContain("Empfohlen sind 5,63 €.");
    expect(html).toContain("separat per E-Mail-Link final bestätigt");
    expect(html).toContain("zusätzliche Sicherheits- und Trennlogik ist bewusst möglich");
    expect(html).toContain("Mitgliedspreis für „Interessiert“: 0 €");
    expect(html).toContain("Regulärer Preis für „Interessiert“: 3,99 €");
    expect(html).toContain('href="/mitglied-werden"');
  });
});
