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
  it("keeps the homepage focused on developments, participation and Voxy guidance", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Verstehen, was sich verändert. Mitreden, wo es zählt.");
    expect(html).toContain("Aktuelle Entwicklungen entdecken");
    expect(html).toContain("Beitrag prüfen");
    expect(html).toContain("Mit Voxy");
    expect(html).toContain("Nicht nur die nächste Schlagzeile.");
    expect(html).toContain("Was ist neu?");
    expect(html).toContain("Was ist belegt?");
    expect(html).toContain("Was bleibt offen?");
    expect(html).toContain("Wo kannst du mitwirken?");
    expect(html).toContain("Dossiers verstehen");
    expect(html).toContain("Ein System, unterschiedliche Aufgaben");
    expect(html).toContain("Für Bürger:innen");
    expect(html).toContain("Für Organisationen, Medien &amp; Kultur");
    expect(html).toContain("Für Verwaltung &amp; Behörden");
    expect(html).toContain("eDebatte veröffentlicht nichts automatisch.");
    expect(html).toContain("/brand/voxy/voxy-create-guide-light.png");
    expect(html).toContain("/brand/voxy/voxy-create-guide-dark.png");
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/themen"');
    expect(html).toContain('href="/dossier"');

    const developmentsIndex = html.indexOf("Aktuelle Entwicklungen entdecken");
    const contributionIndex = html.indexOf("Beitrag prüfen");
    expect(developmentsIndex).toBeGreaterThan(-1);
    expect(contributionIndex).toBeGreaterThan(developmentsIndex);

    expect(html).not.toContain("Review Queue");
    expect(html).not.toContain("Runtime-basiert");
    expect(html).not.toContain("/brand/voxy/voxy-presenting.webp");
  });
});
