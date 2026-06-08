import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

describe("landing clarity contract", () => {
  it("renders the human civic landing with direct contribution intake and clear public actions", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Dein Beitrag kann mehr bewirken.");
    expect(html).toContain("Was soll öffentlich besser");
    expect(html).toContain("verstanden</span>, geprüft oder entschieden werden?");
    expect(html).toContain(
      "Schreib einen Gedanken, eine Frage, ein Problem oder einen Vorschlag. eDebatte hilft dabei, deinen Beitrag einzuordnen und mit bestehenden Themen, Argumenten und offenen Fragen zu verbinden.",
    );
    expect(html).toContain("Beitrag eingeben");
    expect(html).toContain("Beitrag einordnen");
    expect(html).toContain("Beispiele ansehen");
    expect(html).toContain("Für Verwaltung / Organisation ansehen");
    expect(html).toContain("Demo anfragen");
    expect(html).toContain(
      "Noch keine Veröffentlichung · keine automatische Prüfung · du bestätigst jeden nächsten Schritt",
    );
    expect(html).toContain("Themen erkennen");
    expect(html).toContain("Dossier aufbauen");
    expect(html).toContain("Sichtweisen sammeln");
    expect(html).toContain("Abstimmen &amp; auswerten");
    expect(html).toContain("Mitmachen kostenlos");
    expect(html).toContain("Keine Datenverkäufe");
    expect(html).toContain("Noch keine Veröffentlichung");
    expect(html).toContain("Schreib kurz, worum es geht — ich helfe beim Einordnen.");
    expect(html).toContain('data-voxy-appearance="hero"');
    expect(html).toContain("Schreib kurz, worum es geht. Ich helfe beim Einordnen, bevor du den nächsten Schritt bestätigst.");
    expect(html).toContain("Themen, an die dein Beitrag");
    expect(html).toContain("anknüpfen</span> kann.");
    expect(html).toContain("Beispiele zum Ausprobieren");
    expect(html).toContain("Ein Anlassraum hält ein gemeinsames Thema zusammen.");
    expect(html).toContain("Was ist belegt?");
    expect(html).toContain("Was ist offen?");
    expect(html).toContain("Ein Dossier bündelt Belege, Fragen und Optionen.");
    expect(html).toContain("Kostenlos mitmachen. Themen gemeinsam weiterentwickeln.");
    expect(html).toContain("Nichts wird automatisch veröffentlicht. Du entscheidest, wann dein Beitrag weitergeht.");
    expect(html).toContain("VoiceOpenGov ist die Initiative");
    expect(html).toContain("Mehr zur Initiative");
    expect(html).toContain("href=\"#start-beispiele\"");
    expect(html).toContain("href=\"/pricing/institutionen\"");
    expect(html).toContain("href=\"/kontakt\"");
    expect(html).toContain("href=\"/create?intent=check\"");
    expect(html).toContain("href=\"/dossier\"");
    expect(html).toContain("href=\"/account/organization\"");

    expect(html).not.toContain("Beteiligungs- und Dossier-Tool");
    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("für Parteien");
    expect(html).not.toContain("Entitlement");
    expect(html).not.toContain("review-first");
    expect(html).not.toContain("Arbeitsraum:");
    expect(html).not.toContain("/demo/");
  });

  it("keeps landing source files free of forbidden card utility tokens", () => {
    const sources = [
      "src/app/start/LandingStart.tsx",
      "src/components/quickActions/TaskFirstQuickActionCenter.tsx",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

    const forbiddenTokens = [
      "shadow-",
      "drop-shadow",
      "bg-white",
      "bg-black",
      "bg-slate-",
      "bg-zinc-",
      "bg-neutral-",
      "border-slate-",
      "border-zinc-",
      "ring-1",
    ];

    for (const source of sources) {
      for (const token of forbiddenTokens) {
        expect(source).not.toContain(token);
      }
      expect(source).not.toContain("Developer-Hinweis");
    }
  });

  it("keeps the productive start route free of demo, seed and localStorage landing fallbacks", () => {
    const startPageSource = readFileSync(resolve(process.cwd(), "src/app/start/page.tsx"), "utf8");
    const landingSource = readFileSync(resolve(process.cwd(), "src/app/start/LandingStart.tsx"), "utf8");

    expect(startPageSource).not.toContain("selectExamples");
    expect(startPageSource).not.toContain("seedKey");
    expect(startPageSource).not.toContain("/demo/");
    expect(landingSource).not.toContain("localStorage");
    expect(landingSource).not.toContain("/demo/");
  });
});
