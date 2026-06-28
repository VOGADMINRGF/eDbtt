import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/context/LocaleContext";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import DemoCreatePage from "@/app/demo/create/page";

describe("/demo/create shared intake surface", () => {
  it("renders the same core hero, mode switch and intake anchors as /create", async () => {
    const tree = await DemoCreatePage({
      searchParams: Promise.resolve({ persona: "journalist" }),
    });
    const html = renderToStaticMarkup(createElement(LocaleProvider, { initialLocale: "de" }, tree));

    expect(html).toContain("Beschreibe,");
    expect(html).toContain("was geklärt werden soll");
    expect(html).toContain("Beitragen");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Entwerfen");
    expect(html).toContain("demo-create-primary-intake");
    expect(html).toContain("Anhang");
    expect(html).toContain("Sprache");
    expect(html).toContain("Statussprache bleibt konsistent");
    expect(html).not.toContain("Was möchtest du einreichen?");
  });
});
