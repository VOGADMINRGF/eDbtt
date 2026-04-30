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

describe("no legacy price logic contract", () => {
  it("removes old public price logic and legacy package naming on main surfaces", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage({}));
    const vormerkenHtml = renderToStaticMarkup(<VormerkenPage />);
    const combined = `${pricingHtml}\n${vormerkenHtml}`;

    expect(combined).toContain("Interessiert: 4,99 €");
    expect(combined).toContain("14,99 €");
    expect(combined).toContain("29,99 €");
    expect(combined).toContain("5,63");

    expect(combined).not.toContain("eDebatte Basis");
    expect(combined).not.toContain("eDebatte Start");
    expect(combined).not.toContain("eDebatte Pro");
    expect(combined).not.toContain("Technisches Mapping");
  });
});
