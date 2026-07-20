import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-membership-block-clarity.contract", () => {
  it("explains membership clearly and compactly", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Mitgliedschaft bleibt freiwillig und getrennt vom Paketkauf.");
    expect(html).toContain("Paketpreise bleiben unabhängig vom Mitgliedschaftsantrag gleich.");
    expect(html).toContain("Empfohlener Mitgliedsbeitrag: 5,63 €.");
    expect(html).toContain("separat per E-Mail-Link final bestätigt");
    expect(html).toContain("zusätzliche Sicherheits- und Trennlogik ist bewusst möglich");
    expect(html).toContain("Add-ons sind optional und können bei Bedarf einzeln hinzugebucht werden.");
    expect(html).toContain("Quellenprüfung / Recherche-Kontingent: ca. 10 € je Kontingent (einzeln buchbar)");
    expect(html).not.toContain("Perplexity");
    expect(html).not.toContain("ARI");
    expect(html).not.toContain("Deep Search");
  });
});
