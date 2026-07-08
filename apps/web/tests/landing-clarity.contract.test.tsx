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
  it("renders the split Voxy landing with two direct public entry points", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Was bewegt dich?");
    expect(html).toContain(
      "Bring ein Thema ein oder stimme ab, wo deine Sicht gebraucht wird. Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung.",
    );
    expect(html).toContain("Etwas beitragen");
    expect(html).toContain("Abstimmen &amp; mitmachen");
    expect(html).toContain("Beitrag starten");
    expect(html).toContain("Mitmachen");
    expect(html).toContain("Mit Voxy");
    expect(html).toContain("/brand/voxy/voxy-create-guide-light.png");
    expect(html).toContain("/brand/voxy/voxy-create-guide-dark.png");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("Debatte &amp; Argumente");
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/themen"');
    expect(html).toContain("href=\"/dossier\"");
    expect((html.match(/data-testid="home-split-primary-card"/g) ?? []).length).toBe(2);

    expect(html).not.toContain("Runtime");
    expect(html).not.toContain("Debug");
    expect(html).not.toContain("Review Queue");
    expect(html).not.toContain("Contract");
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
