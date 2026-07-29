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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("landing clarity contract", () => {
  it("presents the canonical Voxy podcast stage and the eDebatte participation journey", () => {
    const html = renderToStaticMarkup(<LandingStart />);
    const headings = [...html.matchAll(/<h1([^>]*)>/g)];

    expect(headings).toHaveLength(1);
    expect(headings[0]?.[1] ?? "").not.toContain("sr-only");

    expect(html).toContain("Stimmen verbinden.");
    expect(html).toContain("Zusammenhänge sichtbar machen.");
    expect(html).toContain("Gemeinsam entscheiden.");
    expect(html).toContain("eDebatte · getragen von VoiceOpenGov");
    expect(html).toContain("Hallo Nachbar.");
    expect(html).toContain("Voxy am gemeinsamen Tisch");
    expect(html).toContain("/brand/voxy/voxy-podcast-stage.png");
    expect(html).toContain("/brand/voxy/voxy-mini-avatar.webp");

    expect(html).toContain("Für Nachbarn und Bürger");
    expect(html).toContain("Für Initiativen und Communities");
    expect(html).toContain("Für Kommunen und Organisationen");
    expect(html).toContain("Für Medien und Redaktionen");

    expect(html).toContain("Sprachen verbinden");
    expect(html).toContain("Quellen sichtbar machen");
    expect(html).toContain("Zusammenhänge erkennen");
    expect(html).toContain("Debatten statt Kommentarchaos");
    expect(html).toContain("Fakten werden nicht abgestimmt.");
    expect(html).toContain("Von lokal bis global");

    expect(html).toContain("Voxy hört zu und strukturiert");
    expect(html).toContain("Quellen und Perspektiven werden verbunden");
    expect(html).toContain("Die Community prüft, ergänzt und entscheidet");

    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/themen"');
    expect(html).toContain('href="/dossier"');
    expect((html.match(/data-testid="home-entry-card"/g) ?? []).length).toBe(4);
    expect((html.match(/data-testid="home-voxy-launcher"/g) ?? []).length).toBe(1);

    expect(html).not.toContain("500K");
    expect(html).not.toContain("250 Partner");
    expect(html).not.toContain("35 Länder");
    expect(html).not.toContain("Live Poll");
    expect(html).not.toContain("/demo/");
    expect(html).not.toContain("/brand/voxy/voxy-presenting.webp");
  });

  it("keeps landing source files free of forbidden card utility tokens", () => {
    const sources = [
      "src/app/start/LandingStart.tsx",
      "src/features/home/HomeSplitVoxyLanding.tsx",
      "src/features/home/HomeScrollReveal.tsx",
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
    const splitLandingSource = readFileSync(
      resolve(process.cwd(), "src/features/home/HomeSplitVoxyLanding.tsx"),
      "utf8",
    );

    expect(startPageSource).not.toContain("selectExamples");
    expect(startPageSource).not.toContain("seedKey");
    expect(startPageSource).not.toContain("/demo/");
    expect(landingSource).not.toContain("localStorage");
    expect(landingSource).not.toContain("/demo/");
    expect(splitLandingSource).not.toContain("/demo/");
    expect(splitLandingSource).not.toContain("/brand/voxy/voxy-presenting.webp");
  });
});
