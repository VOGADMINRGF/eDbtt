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

    expect(html).toContain("Informationsinfrastruktur für öffentliche Debatten");
    expect(html).toContain("eDebatte macht sichtbar, was Menschen bewegt");
    expect(html).toContain("Starte kostenlos über Themen, Swipes und Hinweise");
    expect(html).toContain("Signal -&gt; Dossier -&gt; Runde -&gt; Mandat -&gt; Umsetzung");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("Jetzt swipen");
    expect(html).toContain("Hinweis einreichen");
    expect(html).toContain("Professionell nutzen");
    expect(html).toContain("Pakete &amp; Preise");
    expect(html).toContain("Bürger:innen");
    expect(html).toContain("Kommunen");
    expect(html).toContain("Beteiligungsbüros");
    expect(html).toContain("Journalist:innen");
    expect(html).toContain("WORLD");
    expect(html).toContain("Arbeitsfläche (Vorschau)");
  });
});
