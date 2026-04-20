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

    const applyIndex = html.indexOf("Empfehlung übernehmen");
    const directOrderIndex = html.indexOf("Direkt bestellen");
    const quoteIndex = html.indexOf("Kostenvoranschlag anfordern");
    const conversationIndex = html.indexOf("Gespräch anfragen");

    expect(applyIndex).toBeGreaterThan(-1);
    expect(directOrderIndex).toBeGreaterThan(applyIndex);
    expect(quoteIndex).toBeGreaterThan(directOrderIndex);
    expect(conversationIndex).toBeGreaterThan(quoteIndex);
    expect(html).toContain("inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold");
  });
});

