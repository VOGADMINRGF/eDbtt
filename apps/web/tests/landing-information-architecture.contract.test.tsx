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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("landing information architecture contract", () => {
  it("keeps the homepage focused on a complete ballot-to-create journey", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Abstimmen. Verstehen. Gemeinsam weiterkommen.");
    expect(html).toContain("Direkt ausprobieren");
    expect(html).toContain("Passt zu eurer Gruppe");
    expect(html).toContain("In drei Schritten");
    expect(html).toContain("Mit einer passenden Vorlage starten");
    expect(html).toContain("Mehr als ein Prozentwert");
    expect(html).toContain("Klein anfangen. Ohne erfundene Hürden.");
    expect(html).toContain("Menschen entscheiden.");
    expect(html).toContain("Welche Frage möchtet ihr morgen gemeinsam klären?");
    expect(html).toContain('href="/runden/new?gtm=1&amp;source=homepage"');
    expect(html).toContain('href="/swipes"');

    expect(html).not.toContain("Review Queue");
    expect(html).not.toContain("Runtime-basiert");
    expect(html).not.toContain("Orchestrator");
    expect(html).not.toContain("Dossier");
    expect(html).not.toContain("Anlassraum");
  });
});
