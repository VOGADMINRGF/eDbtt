import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage(params?: Record<string, string>) {
  const element = await InstitutionalPricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("institutional-recommendation-visual-priority.contract", () => {
  it("keeps recommendation visually dominant after guided setup", async () => {
    const html = await renderPage();

    const frameIndex = html.indexOf("3. Wie sieht euer Einsatzrahmen aus?");
    const recommendationIndex = html.indexOf("Empfohlene Konfiguration");

    expect(frameIndex).toBeGreaterThan(-1);
    expect(recommendationIndex).toBeGreaterThan(frameIndex);
    expect(html).toContain("border-2 border-sky-400/80");
    expect(html).toContain("shadow-[0_22px_60px_rgba(14,165,233,0.18)]");
  });
});

