import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

describe("no-next-steps-noise.contract", () => {
  it("does not render a standalone next-steps noise block in package start flow", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).not.toContain("Was passiert als Nächstes?");
    expect(html).not.toContain("What happens next?");
  });
});

