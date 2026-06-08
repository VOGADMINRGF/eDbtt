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

    expect(html).toContain("Dein Beitrag kann mehr bewirken.");
    expect(html).toContain("Was soll öffentlich besser");
    expect(html).toContain("verstanden</span>, geprüft oder entschieden werden?");
    expect(html).toContain("Beitrag einordnen");
    expect(html).toContain("Beispiele ansehen");
    expect(html).toContain("Für Verwaltung / Organisation ansehen");
    expect(html).toContain("Demo anfragen");
    expect(html).toContain("Beitrag eingeben");
    expect(html).toContain("Beispiele zum Ausprobieren");
    expect(html).toContain("Ein Anlassraum hält ein gemeinsames Thema");
    expect(html).toContain("Was ist belegt?");
    expect(html).toContain("Was ist offen?");
    expect(html).toContain("Ein Dossier bündelt Belege, Fragen und Optionen.");
    expect(html).toContain("Kostenlos mitmachen. Themen gemeinsam weiterentwickeln.");
    expect(html).toContain("Keine Datenverkäufe");
    expect(html).toContain("VoiceOpenGov ist die Initiative");
    expect(html).toContain(
      "Nichts wird automatisch veröffentlicht. Du entscheidest, wann dein Beitrag weitergeht.",
    );

    const primaryIndex = html.indexOf("Beitrag einordnen");
    const secondaryIndex = html.indexOf("Beispiele ansehen");
    expect(primaryIndex).toBeGreaterThan(-1);
    expect(secondaryIndex).toBeGreaterThan(primaryIndex);
    expect(html).toContain("href=\"#start-beispiele\"");
    expect(html).toContain("href=\"/pricing/institutionen\"");
    expect(html).toContain("href=\"/kontakt\"");
    expect(html).toContain("href=\"/create?intent=check\"");
    expect(html).toContain("href=\"/dossier\"");
    expect(html).toContain("href=\"/account/organization\"");

    expect(html).toContain("Ein guter");
    expect(html).toContain("nächster Schritt</span> braucht einen verlässlichen Ort.");
    expect(html).toContain("Mehr als Bürgerbüro");
    expect(html).toContain("Nicht Social Media");

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("Whistleblower");
    expect(html).not.toContain("für Parteien");
    expect(html).not.toContain("Entitlement");
    expect(html).not.toContain("review-first");
  });
});
