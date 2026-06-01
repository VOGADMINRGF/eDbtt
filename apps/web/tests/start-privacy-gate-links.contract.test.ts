import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import LandingStart from "@/app/start/LandingStart";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/start",
}));

describe("start privacy gate link contract", () => {
  it("marks active create and participation ctas as privacy-gated triggers", () => {
    const html = renderToStaticMarkup(createElement(LandingStart));

    expect((html.match(/data-requires-privacy-gate="true"/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(html).toContain('href="/create?intent=check"');
    expect(html).toContain('href="/create?intent=contribute"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/runden/new"');
    expect(html).not.toContain('href="/create"');
  });
});
