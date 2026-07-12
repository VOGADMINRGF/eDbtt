import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

vi.mock("server-only", () => ({}));

import VormerkenPage from "@/app/vormerken/page";

function setQuery(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("order entry trust copy contract", () => {
  it("keeps free core and conscious activation visible in DE order entry", () => {
    setQuery("segment=organisationen");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Lesen, Swipes und Grundbeteiligung bleiben frei.");
    expect(html).toContain("Keine versteckten AI-Kosten");
    expect(html).toContain("Mitgliedschaft und Paketfreischaltung werden getrennt geführt.");
  });

  it("keeps the same promise in EN order entry", () => {
    setQuery("lang=en&segment=kommunen");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("reading, swipes and basic participation stay free");
    expect(html).toContain("No hidden AI costs");
    expect(html).not.toContain("Lesen, Swipes und Grundbeteiligung bleiben frei.");
  });
});
