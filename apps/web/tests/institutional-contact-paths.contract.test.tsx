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

describe("institutional-contact-paths.contract", () => {
  it("groups institutional contact paths on /pricing/institutionen", async () => {
    const html = renderToStaticMarkup(await InstitutionalPricingPage({}));

    expect(html).toContain("Kontaktwege");
    expect(html).toContain("Kontakt zum Team");
    expect(html).toContain("MS Teams");
    expect(html).toContain("mailto:sales@edebatte.org");
    expect(html).toContain("channel=phone");
  });

  it("keeps grouped contact paths visible in institutional /vormerken flow", () => {
    setSearch("segment=organisationen&paket=b2b_basis");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Kontaktwege");
    expect(html).toContain("Kontakt zum Team");
    expect(html).toContain("MS Teams");
    expect(html).toContain("mailto:sales@edebatte.org");
  });
});

