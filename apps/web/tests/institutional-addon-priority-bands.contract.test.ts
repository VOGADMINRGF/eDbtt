import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage() {
  const element = await InstitutionalPricingPage({ searchParams: {} });
  return renderToStaticMarkup(element);
}

describe("institutional-addon-priority-bands.contract", () => {
  it("orders add-ons by relevance bands: recommended -> optional -> need-based", async () => {
    const html = await renderPage();

    const recommendedIndex = html.indexOf("Empfohlene Erweiterungen");
    const recommendationSection = html.slice(recommendedIndex);
    const optionalIndex = recommendationSection.indexOf("Optional");
    const needBasedIndex = recommendationSection.indexOf("Nur bei Bedarf");

    expect(recommendedIndex).toBeGreaterThan(-1);
    expect(optionalIndex).toBeGreaterThan(-1);
    expect(needBasedIndex).toBeGreaterThan(optionalIndex);
  });
});
