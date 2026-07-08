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
  it("keeps the homepage above the fold focused on headline, Voxy and two primary actions", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Was bewegt dich?");
    expect(html).toContain("Etwas beitragen");
    expect(html).toContain("Abstimmen &amp; mitmachen");
    expect(html).toContain("Beitrag starten");
    expect(html).toContain("Mitmachen");
    expect(html).toContain("Mit Voxy");
    expect(html).toContain("Review-first · Keine automatische Veröffentlichung · Du entscheidest den nächsten Schritt");
    expect(html).toContain("veröffentlicht wird nichts ohne Prüfung.");
    expect(html).toContain("/brand/voxy/voxy-create-guide-light.png");
    expect(html).toContain("/brand/voxy/voxy-create-guide-dark.png");
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/themen"');
    expect(html).toContain("href=\"/dossier\"");

    const contributeIndex = html.indexOf("Beitrag starten");
    const participateIndex = html.indexOf("Mitmachen");
    expect(contributeIndex).toBeGreaterThan(-1);
    expect(participateIndex).toBeGreaterThan(contributeIndex);

    expect(html).not.toContain("Ein Anlassraum hält ein gemeinsames Thema");
    expect(html).not.toContain("Was ist belegt?");
    expect(html).not.toContain("Kostenlos mitmachen. Themen gemeinsam weiterentwickeln.");
    expect(html).not.toContain("Review Queue");
    expect(html).not.toContain("Runtime");
    expect(html).not.toContain("/brand/voxy/voxy-presenting.webp");
  });
});
