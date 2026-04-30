import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

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
    expect(html).toContain("Segmente");
    expect(html).toContain('href="/pricing?segment=organisationen"');
    expect(html).toContain("segment=organisationen");
    expect(html).toContain('href="/vormerken?paket=b2b_basis&amp;segment=organisationen"');
    expect(html).toContain("B2B/B2G-Konditionen ansehen");
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
