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

describe("/vormerken i18n contract", () => {
  it("renders EN package reservation flow without DE fallback copy", () => {
    setSearch("lang=en");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Choose package and prepare start");
    expect(html).toContain("eDebatte Interested");
    expect(html).toContain("Select package");
    expect(html).toContain("Go to B2B/B2G conditions");
    expect(html).toContain("I also want to request VoiceOpenGov membership.");

    expect(html).not.toContain("Technisches Mapping");
    expect(html).not.toContain("citizenBasic");
    expect(html).not.toContain("citizenPremium");
    expect(html).not.toContain("citizenPro");
  });

  it("keeps EN package query and institutional route stable", () => {
    setSearch("lang=en&paket=pro");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("eDebatte Co-creating");
    expect(html).toContain("Selected");
    expect(html).toContain("Go to B2B/B2G conditions");
    expect(html).toContain('href="/pricing/institutionen?lang=en"');
    expect(html).toContain('href="/pricing?lang=en"');
  });
});
