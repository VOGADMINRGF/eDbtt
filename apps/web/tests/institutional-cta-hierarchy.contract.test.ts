import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage() {
  const element = await InstitutionalPricingPage({ searchParams: {} });
  return renderToStaticMarkup(element);
}

describe("institutional-cta-hierarchy.contract", () => {
  it("keeps CTA order as primary -> secondary -> tertiary in recommendation area", async () => {
    const html = await renderPage();

    const recommendationIndex = html.indexOf("Empfohlene Konfiguration");
    const recommendationSection = html.slice(recommendationIndex);
    const applyIndex = recommendationSection.indexOf("Empfehlung übernehmen");
    const directOrderIndex = recommendationSection.indexOf("Freischaltung anfragen");
    const quoteIndex = recommendationSection.indexOf("Kostenvoranschlag anfordern");
    const conversationIndex = recommendationSection.indexOf("Gespräch anfragen");

    expect(recommendationIndex).toBeGreaterThan(-1);
    expect(applyIndex).toBeGreaterThan(-1);
    expect(directOrderIndex).toBeGreaterThan(applyIndex);
    expect(quoteIndex).toBeGreaterThan(directOrderIndex);
    expect(conversationIndex).toBeGreaterThan(quoteIndex);
    expect(html).toContain("inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold");
  });
});
