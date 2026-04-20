import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

describe("vormerken-membership-application-visibility.contract", () => {
  it("renders membership as visible civic decision block in private flow", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Initiative &amp; Mitgliedschaft (optional)");
    expect(html).toContain("Mitgliedschaft ist keine Abo-Option");
    expect(html).toContain("Ich möchte zusätzlich die VoiceOpenGov-Mitgliedschaft beantragen.");
    expect(html).toContain("finale Bestätigung erfolgt separat per E-Mail-Link");
    expect(html).toContain("Empfohlener Mitgliedsbeitrag: 5,63 €");
  });
});
