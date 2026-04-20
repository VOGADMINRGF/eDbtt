import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

function setSearch(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("vormerken package logic aligned with pricing", () => {
  it("reuses the same private package world and activation narrative in DE", async () => {
    setSearch();
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);

    ["eDebatte Interessiert", "eDebatte Aktiv", "eDebatte Mitgestaltend"].forEach((label) => {
      expect(pricingHtml).toContain(label);
      expect(vormerkenHtml).toContain(label);
    });

    expect(vormerkenHtml).toContain("Paket wählen und Start vorbereiten");
    expect(vormerkenHtml).toContain("Paketauswahl");
    expect(vormerkenHtml).not.toContain("Ausgewähltes Paket");
    expect(vormerkenHtml).toContain("Mitgliedschaft und Paketfreischaltung werden getrennt geführt.");
  });

  it("reuses the same private package world and activation narrative in EN", async () => {
    setSearch("lang=en");
    const pricingHtml = renderToStaticMarkup(await PricingPage({ searchParams: { lang: "en" } }));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);

    ["eDebatte Interested", "eDebatte Active", "eDebatte Co-creating"].forEach((label) => {
      expect(pricingHtml).toContain(label);
      expect(vormerkenHtml).toContain(label);
    });

    expect(vormerkenHtml).toContain("Choose package and prepare start");
    expect(vormerkenHtml).toContain("Package selection");
    expect(vormerkenHtml).not.toContain("Selected package");
    expect(vormerkenHtml).toContain("Membership and package activation are handled separately.");
  });
});
