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
  it("renders the debattenradar and dossier-first landing with clear public actions", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={demoBlocks as any} />);

    expect(html).toContain("Informationsstruktur für öffentliche Debatten");
    expect(html).toContain("Was Menschen bewegt, wird sichtbar.");
    expect(html).toContain("Was offen ist, wird klärbar.");
    expect(html).toContain("eDebatte sammelt Hinweise, Themen, Quellen, Argumente");
    expect(html).toContain("Thema prüfen");
    expect(html).toContain("Beispiel-Dossier ansehen");
    expect(html).toContain("Professionell nutzen");
    expect(html).toContain("Dossier öffnen");
    expect(html).toContain("Pakete &amp; Preise ansehen");
    expect(html).toContain("Für Institutionen");
    expect(html).toContain("Mehr zur Initiative");
    expect(html).toContain("So funktioniert’s");
    expect(html).toContain("Zur Initiative");
    expect(html).toContain("Anmelden");
    expect(html).toContain("href=\"/themen\"");
    expect(html).toContain("href=\"/create\"");
    expect(html).toContain("href=\"/dossier/demo\"");
    expect(html).toContain("href=\"/pricing\"");
    expect(html).toContain("href=\"/pricing/institutionen\"");
    expect(html).toContain("Worum geht es?");
    expect(html).toContain("Was ist belegt?");
    expect(html).toContain("Was ist offen?");
    expect(html).toContain("Welche Optionen gibt es?");
    expect(html).toContain("Wer ist zuständig?");
    expect(html).toContain("Wie sehen andere es?");
    expect(html).toContain("WORLD");
    expect(html).not.toContain("Jetzt swipen");
    expect(html).not.toContain("Arbeitsfläche (Vorschau)");
    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Beteiligungs- und Dossier-Tool");
    expect(html).not.toContain("Kanonischer Einstieg");
  });
});
