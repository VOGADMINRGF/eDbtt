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

describe("vormerken-private-no-quote.contract", () => {
  it("hides quote/download modules in private segment flow", () => {
    setSearch("segment=privat&paket=basis");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).not.toContain("Kostenvoranschlag (B2B/B2G)");
    expect(html).not.toContain("Kostenvoranschlag downloaden");
    expect(html).not.toContain("Abschlussweg");
  });
});

