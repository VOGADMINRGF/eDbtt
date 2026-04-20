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

describe("institutional-quote-optional-not-primary.contract", () => {
  it("keeps quote optional while direct ordering remains default", () => {
    setSearch("segment=kommunen&paket=b2g_basis");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Kostenvoranschlag ist optional und nicht der Primärpfad.");
    expect(html).toContain("Direkt bestellen");
    expect(html).toContain("Kostenvoranschlag erstellen");
  });
});

