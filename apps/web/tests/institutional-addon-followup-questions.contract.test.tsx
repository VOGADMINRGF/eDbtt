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

describe("institutional-addon-followup-questions.contract", () => {
  it("shows addon follow-up block only when institutional add-ons are selected", () => {
    setSearch("segment=organisationen&paket=b2b_basis&addons=reports_outcomes,moderation_assistenz");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Relevante Rückfragen");
    expect(html).toContain("Für wen sollen die Auswertungen erstellt werden?");
    expect(html).toContain("Ist das Format intern, öffentlich oder gemischt?");
  });
});

