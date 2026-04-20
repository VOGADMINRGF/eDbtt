import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderPage(params?: Record<string, string>) {
  const element = await InstitutionalPricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("institutional-addons-progressive-disclosure.contract", () => {
  it("keeps a recommended-add-ons block and secondary options behind details", async () => {
    const html = await renderPage();

    expect(html).toContain("Empfohlene Erweiterungen");
    expect(html).toContain("<details");
    expect(html).toContain("Optional");
    expect(html).toContain("Nur bei Bedarf");
    expect(html).toContain("Status");
  });
});
