import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage(params?: Record<string, string>) {
  const element = await InstitutionalPricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("institutional-guided-selection-flow.contract", () => {
  it("orders the institutional flow as segment -> goal -> frame -> recommendation", async () => {
    const html = await renderPage();

    const segmentIndex = html.indexOf("1. Wer seid ihr?");
    const goalIndex = html.indexOf("2. Was steht im Vordergrund?");
    const frameIndex = html.indexOf("3. Wie sieht euer Einsatzrahmen aus?");
    const recommendationIndex = html.indexOf("Empfohlene Konfiguration");

    expect(segmentIndex).toBeGreaterThan(-1);
    expect(goalIndex).toBeGreaterThan(segmentIndex);
    expect(frameIndex).toBeGreaterThan(goalIndex);
    expect(recommendationIndex).toBeGreaterThan(frameIndex);
  });
});

