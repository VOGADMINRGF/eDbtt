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
  it("shows shared package logic and segment-aware order entry on /pricing", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "organisationen" } }));

    expect(html).toContain("Gemeinsame Paketlogik mit /order");
    expect(html).toContain("Mit aktuellem Segment in /order starten");
    expect(html).toContain('href="/order?segment=organisationen"');
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
