import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage() {
  const element = await InstitutionalPricingPage({ searchParams: {} });
  return renderToStaticMarkup(element);
}

describe("institutional-visual-overload-regression.contract", () => {
  it("removes old catalog-heavy wording and keeps concise guidance blocks", async () => {
    const html = await renderPage();

    expect(html).toContain("Direkt zur Auswahl");
    expect(html).toContain("Empfohlene Konfiguration");
    expect(html).not.toContain("Betriebsrahmen vorauswählen");
    expect(html).not.toContain("Shopfähig bestellen");
    expect(html).not.toContain("Add-ons ergänzen");
  });
});

