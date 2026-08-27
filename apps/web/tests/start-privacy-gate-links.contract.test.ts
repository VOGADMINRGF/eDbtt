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

vi.mock("next/image", () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: Record<string, unknown>) => createElement("img", { alt: "", ...props }),
}));

describe("start privacy gate link contract", () => {
  it("marks active create and participation ctas as privacy-gated triggers", () => {
    const html = renderToStaticMarkup(createElement(LandingStart));
    const createAndParticipationLinks = [
      ...html.matchAll(/<a\b[^>]*href="\/(?:create|swipes)"[^>]*>/g),
    ];

    expect(createAndParticipationLinks).toHaveLength(6);
    for (const [link] of createAndParticipationLinks) {
      expect(link).toContain('data-requires-privacy-gate="true"');
    }
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).not.toContain('href="/runden/new"');
    expect(html).not.toContain('href="/create?intent=check"');
  });
});
