import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import { getPricingEntryTrustCopy } from "@features/pricing";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import OrderPage from "@/app/order/page";
import VormerkenPage from "@/app/vormerken/page";

const DE_TRUST = getPricingEntryTrustCopy("de");

function setSearch(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("conversion family harmonization", () => {
  it("keeps hero scale aligned on pricing and vormerken", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    setSearch();
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);

    expect(pricingHtml).toContain("p-6 shadow-sm sm:p-8 lg:p-10");
    expect(vormerkenHtml).toContain("p-6 shadow-sm sm:p-8 lg:p-10");
  });

  it("keeps package switching possible after kommunen preselection", () => {
    setSearch("segment=kommunen&paket=b2g_pro");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Kommune / Verwaltung Aktivierung");
    expect(html).toContain("Kommune / Verwaltung Betrieb Plus");
    expect(html).toContain("Ausgewählt");
    expect(html).toContain("Paket auswählen");
  });

  it("keeps membership and package activation clearly separated", () => {
    setSearch();
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain(DE_TRUST.membershipActivationSeparation);
    expect(html).toContain(DE_TRUST.privateMemberInterestedHint);
  });

  it("keeps /order as entry surface without locking segment or package", () => {
    setSearch("segment=organisationen&paket=b2b_basis");
    const html = renderToStaticMarkup(<OrderPage />);

    expect(html).toContain("Vorauswahl aktiv");
    expect(html).toContain("Segment wählen");
    expect(html).toContain("Paket wählen und Start vorbereiten");
  });
});
