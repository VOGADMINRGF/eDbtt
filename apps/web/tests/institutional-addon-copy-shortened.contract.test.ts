import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage() {
  const element = await InstitutionalPricingPage({ searchParams: {} });
  return renderToStaticMarkup(element);
}

describe("institutional-addon-copy-shortened.contract", () => {
  it("shows compact addon cards with only essential fields", async () => {
    const html = await renderPage();

    expect(html).toContain("Empfohlene Erweiterungen");
    expect(html).toContain("Event-Begleitung");
    expect(html).toContain("Sinnvoll bei");
    expect(html).toContain("Status");
    expect(html).not.toContain("Eher nicht nötig");
    expect(html).not.toContain("Wirkung / ROI");
  });
});

