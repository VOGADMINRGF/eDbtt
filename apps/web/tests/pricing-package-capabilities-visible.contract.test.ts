import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-package-capabilities-visible.contract", () => {
  it("shows concrete package capabilities directly in the cards", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Was ist enthalten?");
    expect(html).toContain("Beitragen: Anliegen einbringen");
    expect(html).toContain("Swipes");
    expect(html).toContain("Prüfen: Beiträge, Texte, Agenden");
    expect(html).toContain("Guided Flow");
    expect(html).toContain("Human-Loop");
    expect(html).toContain("Optionale Add-ons");
  });
});
