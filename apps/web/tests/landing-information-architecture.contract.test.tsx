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
  it("keeps the human landing journey and trust boundaries visible", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Stell dein Anliegen ein. Lass das stärkste Argument gewinnen.");
    expect(html).toContain("Anliegen einbringen");
    expect(html).toContain("Ich reiche ein Anliegen ein");
    expect(html).toContain("Anlassraum/Event starten");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("Thema ansehen");
    expect(html).toContain("Nicht noch ein Feed. Nicht nur Ja oder Nein.");
    expect(html).toContain("Schnell einsteigen mit Swipe.");
    expect(html).toContain("Der Anlassraum");
    expect(html).toContain("Faktencheck statt Behauptung gegen Behauptung.");
    expect(html).toContain("Aus Hinweisen wird ein Dossier.");
    expect(html).toContain("Kostenlos mitmachen. Verbindlich weiterentwickeln.");
    expect(html).toContain("keine Datenverkäufe");
    expect(html).toContain("VoiceOpenGov ist die Initiative");

    const primaryIndex = html.indexOf("Anliegen einbringen");
    const secondaryIndex = html.indexOf("Thema ansehen");
    expect(primaryIndex).toBeGreaterThan(-1);
    expect(secondaryIndex).toBeGreaterThan(primaryIndex);
    expect(html).toContain("href=\"/create?intent=contribute\"");
    expect(html).toContain("href=\"/runden/new\"");
    expect(html).toContain("href=\"/themen\"");
    expect(html).toContain("href=\"/swipes\"");
    expect(html).toContain("href=\"/create?intent=check\"");
    expect(html).toContain("href=\"/dossier\"");
    expect(html).toContain("href=\"/account/organization\"");

    expect(html).toContain("Öffentliche Beteiligung braucht einen besseren Ort.");
    expect(html).toContain("Mehr als Bürgerbüro");
    expect(html).toContain("Nicht Social Media");

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Whistleblower");
    expect(html).not.toContain("für Parteien");
    expect(html).not.toContain("Entitlement");
  });
});
