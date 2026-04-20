import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-b2b-secondary-only.contract", () => {
  it("keeps B2B/B2G as a short secondary path", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Für Organisationen, Kommunen, Verbände und Redaktionen gibt es gesonderte Konditionen.");
    expect(html).toContain("B2B/B2G-Konditionen ansehen");
    expect(html).toContain('href="/pricing/institutionen"');

    expect(html).not.toContain("Organisation Aktivierung");
    expect(html).not.toContain("ab 1.500 € / Monat");
  });
});
