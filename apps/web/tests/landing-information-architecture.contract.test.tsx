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

describe("landing information architecture contract", () => {
  it("keeps core civic-tech flow and trust boundaries visible", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={[]} />);

    expect(html).toContain("Informationsstruktur für öffentliche Debatten");
    expect(html).toContain("Was Menschen bewegt, wird sichtbar.");
    expect(html).toContain("Signal");
    expect(html).toContain("Dossier");
    expect(html).toContain("Runde");
    expect(html).toContain("Mandat");
    expect(html).toContain("Umsetzung");
    expect(html).toContain("Wirkung");

    const primaryIndex = html.indexOf("Thema prüfen");
    const secondaryIndex = html.indexOf("Beispiel-Dossier ansehen");
    expect(primaryIndex).toBeGreaterThan(-1);
    expect(secondaryIndex).toBeGreaterThan(primaryIndex);
    expect(html).not.toContain("Jetzt swipen");

    expect(html).toContain("Öffentliche Debatten nachvollziehbar machen.");
    expect(html).toContain("Politisch unabhängig");
    expect(html).toContain("Quellen und KI-Nutzung transparent");
    expect(html).toContain("Anonym, mit Nickname oder verifiziert teilnehmen");
    expect(html).toContain("Keine Umsetzungsgarantie");
    expect(html).toContain("VoiceOpenGov ist die Initiative");
    expect(html).toContain("ersetzt keine demokratischen Verfahren");

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Whistleblower");
    expect(html).not.toContain("für Parteien");
  });
});
