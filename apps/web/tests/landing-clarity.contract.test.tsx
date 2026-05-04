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
  it("renders the human civic landing with clear public actions", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={demoBlocks as any} />);

    expect(html).toContain("Was Menschen bewegt, wird sichtbar.");
    expect(html).toContain("Öffentliche Debatten verständlich machen");
    expect(html).toContain("Nicht noch ein Feed. Nicht nur Ja oder Nein.");
    expect(html).toContain("Schnell einsteigen mit Swipe.");
    expect(html).toContain("Der Anlassraum: ein Ort, an dem ein Thema nicht verloren geht.");
    expect(html).toContain("Faktencheck statt Behauptung gegen Behauptung.");
    expect(html).toContain("Aus Hinweisen wird ein Dossier.");
    expect(html).toContain("Kostenlos mitmachen. Verbindlich weiterentwickeln.");
    expect(html).toContain("Ein Thema. Verschiedene Blickpunkte.");
    expect(html).toContain("Keine Datenverkäufe");
    expect(html).toContain("VoiceOpenGov ist die Initiative");
    expect(html).toContain("Thema prüfen");
    expect(html).toContain("Anliegen einbringen");
    expect(html).toContain("Beispiel ansehen");
    expect(html).toContain("Swipes ansehen");
    expect(html).toContain("Eigenes Thema starten");
    expect(html).toContain("Dossier öffnen");
    expect(html).toContain("Pakete &amp; Preise ansehen");
    expect(html).toContain("Für Institutionen");
    expect(html).toContain("Mehr zur Initiative");
    expect(html).toContain("So funktioniert’s");
    expect(html).toContain("Zur Initiative");
    expect(html).toContain("Anmelden");
    expect(html).toContain("href=\"/themen\"");
    expect(html).toContain("href=\"/create?intent=check\"");
    expect(html).toContain("href=\"/create?intent=contribute\"");
    expect(html).toContain("href=\"/dossier/demo\"");
    expect(html).toContain("href=\"/swipes\"");
    expect(html).toContain("href=\"/pricing\"");
    expect(html).toContain("href=\"/pricing/institutionen\"");

    expect(html).toContain("Worum geht es?");
    expect(html).toContain("Was ist belegt?");
    expect(html).toContain("Was ist offen?");
    expect(html).toContain("Welche Optionen gibt es?");
    expect(html).toContain("Wer ist zuständig?");
    expect(html).toContain("Wie sehen andere es?");

    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Beteiligungs- und Dossier-Tool");
    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("für Parteien");
  });
});
