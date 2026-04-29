import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-membership-block-clarity.contract", () => {
  it("explains membership clearly and compactly", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Der Mitgliedschaftsantrag bleibt optional. Paketpreis und Mitgliedsbeitrag werden getrennt behandelt.");
    expect(html).toContain("Paketpreise bleiben unabhängig vom Mitgliedschaftsantrag gleich.");
    expect(html).toContain("Empfohlener Mitgliedsbeitrag: 5,63 €.");
    expect(html).toContain("separat per E-Mail-Link final bestätigt");
    expect(html).toContain("zusätzliche Sicherheits- und Trennlogik ist bewusst möglich");
    expect(html).toContain("Add-ons sind optional und können bei Bedarf einzeln hinzugebucht werden.");
    expect(html).toContain("Search Credit / Dossier Search: ca. 10 € je Credit (einzeln buchbar)");
  });
});
