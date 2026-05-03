import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import PricingPage from "@/app/pricing/page";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

function setVormerkenSearch(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("pricing tags annual + handoff contract", () => {
  it("keeps B2C labels as incl. MwSt. and annual preference on /pricing", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "privat" } }));

    expect(html).toContain("4,99 € / Monat inkl. MwSt.");
    expect(html).toContain("14,99 € / Monat inkl. MwSt.");
    expect(html).toContain("29,99 € / Monat inkl. MwSt.");
    expect(html).toContain("Abrechnungsmodus: monatlich · jährliche Zahlung bevorzugt");
    expect(html).not.toContain("Skonto");
  });

  it("keeps kommunen bridge canonical CTA on /pricing", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "kommunen" } }));

    expect(html).toContain('/pricing/institutionen?segment=kommunen#guided-selection');
  });

  it("keeps institutional tax labels as zzgl. MwSt. and stable CTA handoffs", async () => {
    const html = renderToStaticMarkup(
      await InstitutionalPricingPage({ searchParams: { segment: "kommunen" } }),
    );

    expect(html).toContain("B2B- und B2G-Preise verstehen sich zzgl. MwSt.");
    expect(html).toContain("completion=direct_order");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("completion=conversation_request");
    expect(html).toContain("segment=kommunen");
    expect(html).toContain("paket=b2g_basis");
    expect(html).toContain("paket=b2g_pro");
  });

  it("keeps package switching possible after institutional preselection on /vormerken", () => {
    setVormerkenSearch("segment=kommunen&paket=b2g_pro");
    const html = renderToStaticMarkup(createElement(VormerkenPage));

    expect(html).toContain("Kommune / Verwaltung Aktivierung");
    expect(html).toContain("Kommune / Verwaltung Betrieb Plus");
    expect(html).toContain("Paket auswählen");
  });
});
