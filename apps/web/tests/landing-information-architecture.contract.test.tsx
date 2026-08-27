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
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("landing information architecture contract", () => {
  it("keeps the homepage focused on the Voxy-hosted eDebatte journey", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Stimmen verbinden.");
    expect(html).toContain("Zusammenhänge sichtbar machen.");
    expect(html).toContain("Gemeinsam entscheiden.");
    expect(html).toContain("Debatten entdecken");
    expect(html).toContain("Thema einbringen");
    expect(html).toContain("Voxy am gemeinsamen Tisch");
    expect(html).toContain("Für wen ist eDebatte?");
    expect(html).toContain("Für Nachbarn und Bürger");
    expect(html).toContain("Für Initiativen und Communities");
    expect(html).toContain("Für Kommunen und Organisationen");
    expect(html).toContain("Für Medien und Redaktionen");
    expect(html).toContain("Warum eDebatte?");
    expect(html).toContain("So begleitet dich Voxy");
    expect(html).toContain("Jeder Mensch sieht einen Teil.");
    expect(html).toContain("Gemeinsam sehen wir mehr.");
    expect(html).toContain("eDebatte veröffentlicht nichts automatisch.");
    expect(html).toContain("/brand/voxy/voxy-podcast-stage.png");
    expect(html).toContain("/brand/voxy/voxy-mini-avatar.webp");
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/themen"');
    expect(html).toContain('href="/dossier"');

    const discoveryIndex = html.indexOf("Debatten entdecken");
    const contributionIndex = html.indexOf("Thema einbringen");
    expect(discoveryIndex).toBeGreaterThan(-1);
    expect(contributionIndex).toBeGreaterThan(-1);
    expect(discoveryIndex).toBeGreaterThan(contributionIndex);

    const heroIndex = html.indexOf('id="home-hero-title"');
    const narrativeIndex = html.indexOf('data-testid="home-brand-narrative-paragraph"');
    const audienceIndex = html.indexOf('id="home-audience-title"');
    const benefitsIndex = html.indexOf('id="home-benefits-title"');
    const processIndex = html.indexOf('id="home-process-title"');
    const entryIndex = html.indexOf('id="home-entry-title"');
    const closingIndex = html.indexOf('id="home-closing-title"');

    expect(heroIndex).toBeGreaterThan(-1);
    expect(narrativeIndex).toBeGreaterThan(heroIndex);
    expect(audienceIndex).toBeGreaterThan(narrativeIndex);
    expect(benefitsIndex).toBeGreaterThan(audienceIndex);
    expect(processIndex).toBeGreaterThan(benefitsIndex);
    expect(entryIndex).toBeGreaterThan(processIndex);
    expect(closingIndex).toBeGreaterThan(entryIndex);

    expect(html).not.toContain("Review Queue");
    expect(html).not.toContain("Runtime-basiert");
    expect(html).not.toContain("Hero, Guide und Status-Schicht");
    expect(html).not.toContain("/brand/voxy/voxy-presenting.webp");
  });
});
