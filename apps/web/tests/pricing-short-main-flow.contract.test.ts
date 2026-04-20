import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing short main flow contract", () => {
  it("keeps /pricing short and decision-oriented", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Pakete &amp; Preise");
    expect(html).toContain("Paket wählen");
    expect(html).toContain("B2B/B2G-Konditionen ansehen");
    expect(html).toContain("Privatpakete");
    expect(html).toContain("eDebatte Interessiert");
    expect(html).toContain("eDebatte Aktiv");
    expect(html).toContain("eDebatte Mitgestaltend");

    expect(html).not.toContain("Mitgliedschaft beantragen");
    expect(html).not.toContain("Direct connection to /create");
    expect(html).not.toContain("No pay-to-win");
  });
});
