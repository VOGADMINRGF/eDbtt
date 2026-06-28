import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-b2b-secondary-only.contract", () => {
  it("keeps B2B/B2G as a short secondary path", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain(
      "Für Organisationen, Kommunen, Vereine, Verbände, Träger, Medien, Beteiligungsbüros, Agenturen, Stiftungen und Forschung gibt es gesonderte Konditionen.",
    );
    expect(html).toContain("Professionell nutzen");
    expect(html).toContain('href="/pricing/institutionen"');

    expect(html).not.toContain("Organisation Aktivierung");
    expect(html).not.toContain("ab 1.500 € / Monat");
  });
});
