import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

describe("vormerken private package prices contract", () => {
  it("shows final private price logic on package cards", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("eDebatte Interessiert");
    expect(html).toContain("0 € für VoiceOpenGov-Mitglieder");
    expect(html).toContain("3,99 € regulär");
    expect(html).toContain("eDebatte Aktiv");
    expect(html).toContain("9,90 €");
    expect(html).toContain("eDebatte Mitgestaltend");
    expect(html).toContain("29,90 €");
  });
});
