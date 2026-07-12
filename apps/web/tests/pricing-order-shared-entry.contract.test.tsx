import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import { PRICING_PATH_CONTRACT } from "@features/pricing";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import OrderPage from "@/app/order/page";

function setOrderSearch(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("pricing/order shared entry contract", () => {
  it("keeps segment-aware package entry on /pricing", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "organisationen" } }));

    expect(html).toContain("Organisationen · Paketübersicht");
    expect(html).toContain("Weitere Segmente");
    expect(html).toContain('href="/pricing?segment=organisationen"');
    expect(html).toContain("segment=organisationen");
    expect(html).toContain(
      `href="${PRICING_PATH_CONTRACT.primaryOrderPath}?paket=b2b_basis&amp;segment=organisationen"`,
    );
    expect(html).toContain("Professionell nutzen");
  });

  it("keeps /order as preselected entry while preserving segment/package switching", () => {
    setOrderSearch("segment=kommunen&paket=b2g_basis");
    const html = renderToStaticMarkup(<OrderPage />);

    expect(html).toContain("Vorauswahl aktiv");
    expect(html).toContain("Segment wählen");
    expect(html).toContain("Einzelpersonen");
    expect(html).toContain("Kommunen / Verwaltung");
    expect(html).toContain("Paket wählen und Start vorbereiten");
  });
});
