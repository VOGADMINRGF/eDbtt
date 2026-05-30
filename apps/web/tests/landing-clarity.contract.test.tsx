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
    expect(html).toContain("Stell dein Anliegen ein. Lass das stärkste Argument gewinnen.");
    expect(html).toContain("eDebatte macht aus Themen, Fragen und Vorschlägen einen nachvollziehbaren Arbeitsraum");
    expect(html).toContain("Anliegen einreichen");
    expect(html).toContain("Anlassraum anlegen");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("Öffne einen Dialog, statt ein Formular auszufüllen.");
    expect(html).toContain("Was bewegt dich gerade?");
    expect(html).toContain("Anliegen schildern");
    expect(html).toContain("kostenlos mitmachen");
    expect(html).toContain("keine Datenverkäufe");
    expect(html).toContain("keine versteckten KI-Kosten");
    expect(html).toContain("Voxy als Orientierung");
    expect(html).toContain('data-voxy-appearance="hero"');
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

    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Beteiligungs- und Dossier-Tool");
    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("für Parteien");
    expect(html).not.toContain("Entitlement");
    expect(html).not.toContain("/demo/");
  });

  it("keeps the polished landing, quick actions and voxy guide free of raw light/dark utility surfaces", () => {
    const sources = [
      "src/app/start/LandingStart.tsx",
      "src/components/quickActions/TaskFirstQuickActionCenter.tsx",
      "src/components/voxy/VoxyGuide.tsx",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

    for (const source of sources) {
      expect(source).not.toContain("bg-slate-950");
      expect(source).not.toContain("bg-white");
      expect(source).not.toContain("text-black");
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
