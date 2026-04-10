import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PRICING_JOURNEY_SEGMENTS } from "@features/pricing";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import VormerkenPage from "@/app/vormerken/page";

describe("/vormerken package-start flow", () => {
  it("shows the three target groups and package-start semantics", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Paketstart und Freischaltung abstimmen");
    PRICING_JOURNEY_SEGMENTS.forEach((segment) => {
      expect(html).toContain(segment.shortLabel);
    });
    expect(html).toContain("Leistungsumfang und Aktivierung sind getrennt organisiert");
    expect(html).toContain("Paketstart anfragen");
  });

  it("does not present legacy waiting-list wording", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).not.toContain("wir melden uns, sobald der Starttermin feststeht");
    expect(html).not.toContain("irgendwann");
  });

  it("keeps ctas on existing routes and separates membership", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain('href="/pricing"');
    expect(html).toContain('href="/mitglied-antrag"');
    expect(html).toContain("Mitgliedschaft separat");
  });
});

