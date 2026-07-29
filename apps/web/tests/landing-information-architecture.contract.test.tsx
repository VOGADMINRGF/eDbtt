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
    expect(contributionIndex).toBeGreaterThan(discoveryIndex);

    expect(html).not.toContain("Review Queue");
    expect(html).not.toContain("Runtime-basiert");
    expect(html).not.toContain("/brand/voxy/voxy-presenting.webp");
  });
});
