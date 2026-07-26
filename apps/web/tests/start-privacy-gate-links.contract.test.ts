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
  default: (props: Record<string, unknown>) => createElement("img", { alt: "", ...props }),
}));

describe("start privacy gate link contract", () => {
  it("marks active create and participation ctas as privacy-gated triggers", () => {
    const html = renderToStaticMarkup(createElement(LandingStart));

    expect((html.match(/data-requires-privacy-gate="true"/g) ?? []).length).toBe(3);
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).not.toContain('href="/runden/new"');
    expect(html).not.toContain('href="/create?intent=check"');
  });
});
