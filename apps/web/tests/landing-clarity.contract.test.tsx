import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingStart from "@/app/start/LandingStart";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/start",
}));

vi.mock("@/context/LocaleContext", () => ({
  useLocale: () => ({ locale: "de" }),
}));

const demoBlocks = [
  {
    label: "WORLD",
    items: [
      {
        id: "example-1",
        kind: "Debattenpunkt" as const,
        topics: ["Mobilität"],
        title_de: "Stadtmobilität",
        scope: "WORLD" as const,
      },
    ],
  },
];

describe("landing clarity contract", () => {
  it("keeps marquee + shared composer and renders the clarity block", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={demoBlocks as any} />);

    expect(html).toContain("Öffentliche Beteiligung beginnt mit einem klaren Dossier.");
    expect(html).toContain("eDebatte ist das Beteiligungs- und Dossier-Tool.");
    expect(html).toContain("VoiceOpenGov ist die Initiative");
    expect(html).toContain("Signal -&gt; Dossier -&gt; Runde -&gt; Mandat -&gt; Umsetzung");
    expect(html).toContain("Bürger:innen");
    expect(html).toContain("Kommunen");
    expect(html).toContain("Beteiligungsbüros");
    expect(html).toContain("Journalist:innen");
    expect(html).toContain("WORLD");
    expect(html).toContain("Kanonischer Einstieg");
  });
});
