import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage() {
  const element = await InstitutionalPricingPage({ searchParams: {} });
  return renderToStaticMarkup(element);
}

describe("institutional-roi-copy.contract", () => {
  it("uses public-value language instead of ROI jargon in recommendation area", async () => {
    const html = await renderPage();

    expect(html).toContain("Welchen Unterschied es macht");
    expect(html).toContain("Weniger manueller Abstimmungsaufwand");
    expect(html).toContain("Strukturierte Rückläufe");
    expect(html).toContain("Belastbarere Entscheidungsgrundlagen");
    expect(html).not.toContain("ROI");
  });
});
