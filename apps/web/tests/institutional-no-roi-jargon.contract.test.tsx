import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

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

describe("institutional-no-roi-jargon.contract", () => {
  it("avoids ROI jargon on /pricing/institutionen and uses practical value wording", async () => {
    const element = await InstitutionalPricingPage({ searchParams: {} });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Welchen Unterschied es macht");
    expect(html).not.toContain("Wirkung / ROI");
    expect(html).not.toContain("ROI");
  });

  it("keeps non-ROI value language in institutional /vormerken context", () => {
    setSearch("segment=organisationen&paket=b2b_basis");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Welchen Unterschied es macht");
    expect(html).not.toContain("Wirkung / ROI");
    expect(html).not.toContain("ROI");
  });
});

