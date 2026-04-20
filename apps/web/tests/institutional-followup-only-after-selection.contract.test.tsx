import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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

describe("institutional-followup-only-after-selection.contract", () => {
  it("does not show add-on follow-up block by default in institutional mode", () => {
    setSearch("segment=organisationen&paket=b2b_basis");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).not.toContain("Relevante Rückfragen");
  });

  it("shows add-on follow-up block only when add-ons are selected", () => {
    setSearch("segment=organisationen&paket=b2b_basis&addons=reports_outcomes");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Relevante Rückfragen");
    expect(html).toContain("Für wen sollen die Auswertungen erstellt werden?");
  });
});

