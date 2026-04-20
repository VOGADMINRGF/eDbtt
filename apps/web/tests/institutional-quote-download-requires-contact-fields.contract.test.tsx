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

describe("institutional-quote-download-requires-contact-fields.contract", () => {
  it("keeps quote download blocked until required contact fields and consents are present", () => {
    setSearch("segment=kommunen&paket=b2g_basis&quote=1");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Downloadlink per E-Mail anfordern");
    expect(html).toContain("Pflichtangaben oder Zustimmungen");
    expect(html).toContain("disabled");
  });
});
