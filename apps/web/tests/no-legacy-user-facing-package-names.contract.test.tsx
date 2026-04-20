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

describe("no legacy user-facing package names", () => {
  it("keeps legacy DE tier names out of pricing and vormerken surface copy", async () => {
    setSearch();
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);
    const combined = `${pricingHtml}\n${vormerkenHtml}`;

    expect(combined).not.toContain("eDebatte Basis");
    expect(combined).not.toContain("eDebatte Start");
    expect(combined).not.toContain("eDebatte Pro");
    expect(combined).not.toContain("Technisches Mapping");
    expect(combined).not.toContain("citizenBasic");
    expect(combined).not.toContain("citizenPremium");
    expect(combined).not.toContain("citizenPro");
  });

  it("keeps legacy EN tier names out of pricing and vormerken surface copy", async () => {
    setSearch("lang=en");
    const pricingHtml = renderToStaticMarkup(await PricingPage({ searchParams: { lang: "en" } }));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);
    const combined = `${pricingHtml}\n${vormerkenHtml}`;

    expect(combined).not.toContain("eDebatte Basic");
    expect(combined).not.toContain("eDebatte Starter");
    expect(combined).not.toContain("eDebatte Pro");
    expect(combined).not.toContain("Technical mapping");
    expect(combined).not.toContain("citizenBasic");
    expect(combined).not.toContain("citizenPremium");
    expect(combined).not.toContain("citizenPro");
  });
});
