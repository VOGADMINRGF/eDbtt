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
  it("renders the human civic landing with clear public actions", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Was Menschen bewegt, wird sichtbar.");
    expect(html).toContain("Was Menschen");
    expect(html).toContain("Stell dein Anliegen ein. Lass das stärkste Argument gewinnen.");
    expect(html).toContain("eDebatte macht aus Themen, Fragen und Vorschlägen einen nachvollziehbaren Arbeitsraum");
    expect(html).toContain("Anliegen einbringen");
    expect(html).toContain("Thema ansehen");
    expect(html).toContain("Ich reiche ein Anliegen ein");
    expect(html).toContain("Anlassraum/Event starten");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("Öffne einen Dialog, statt ein Formular auszufüllen.");
    expect(html).toContain("Ich sortiere Anliegen.");
    expect(html).toContain("kostenlos mitmachen");
    expect(html).toContain("keine Datenverkäufe");
    expect(html).toContain("keine versteckten KI-Kosten");
    expect(html).toContain("Voxy als Orientierung");
    expect(html).toContain('data-voxy-appearance="hero"');
    expect(html).toContain("Review vor Veröffentlichung.");
    expect(html).toContain("Nicht noch ein Feed. Nicht nur Ja oder Nein.");
    expect(html).toContain("Schnell einsteigen mit Swipe.");
    expect(html).toContain("Der Anlassraum: ein Ort, an dem ein Thema nicht verloren geht.");
    expect(html).toContain("Faktencheck statt Behauptung gegen Behauptung.");
    expect(html).toContain("Aus Hinweisen wird ein Dossier.");
    expect(html).toContain("Kostenlos mitmachen. Verbindlich weiterentwickeln.");
    expect(html).toContain("VoiceOpenGov ist die Initiative");
    expect(html).toContain("Mehr zur Initiative");
    expect(html).toContain("href=\"/themen\"");
    expect(html).toContain("href=\"/create?intent=contribute\"");
    expect(html).toContain("href=\"/runden/new\"");
    expect(html).toContain("href=\"/swipes\"");
    expect(html).toContain("href=\"/create?intent=check\"");
    expect(html).toContain("href=\"/dossier\"");
    expect(html).toContain("href=\"/account/organization\"");

    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Beteiligungs- und Dossier-Tool");
    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("für Parteien");
    expect(html).not.toContain("Entitlement");
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
