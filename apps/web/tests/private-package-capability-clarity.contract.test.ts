import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("private-package-capability-clarity.contract", () => {
  it("makes private package capabilities concrete and decision-oriented", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).toContain("Was ist enthalten?");
    expect(html).toContain("Beitragen: Anliegen einbringen");
    expect(html).toContain("Swipes");
    expect(html).toContain("Guided Flow");
    expect(html).toContain("Human-Loop");
  });
});
