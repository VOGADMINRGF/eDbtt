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
  it("explains the ballot-first journey, audiences and guardrails", () => {
    const html = renderToStaticMarkup(<LandingStart />);
    const headings = [...html.matchAll(/<h1([^>]*)>/g)];

    expect(headings).toHaveLength(1);
    expect(headings[0]?.[1] ?? "").not.toContain("sr-only");

    expect(html).toContain("Abstimmen. Verstehen. Gemeinsam weiterkommen.");
    expect(html).toContain("Direkt ausprobieren");
    expect(html).toContain("Kostenlos Abstimmung starten");
    expect(html).toContain("Vereine");
    expect(html).toContain("Bürgerinitiativen &amp; lokale Gruppen");
    expect(html).toContain("Verbände &amp; Netzwerke");
    expect(html).toContain("Organisationen &amp; Kommunen");
    expect(html).toContain("Frage stellen");
    expect(html).toContain("Link teilen");
    expect(html).toContain("Positionen verstehen");
    expect(html).toContain("Keine Abstimmung über Fakten oder Wahrheit");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("Richtwert bis 30 Teilnehmende");
    expect(html).toContain('href="/runden/new?gtm=1&amp;source=homepage"');
    expect(html).toContain('href="/swipes"');

    expect(html).not.toContain("500K");
    expect(html).not.toContain("250 Partner");
    expect(html).not.toContain("35 Länder");
    expect(html).not.toContain("Live Poll");
    expect(html).not.toContain("/demo/");
    expect(html).not.toContain("/brand/voxy/voxy-presenting.webp");
  });

  it("keeps the conversion landing free of debug and demo language", () => {
    const sources = [
      "src/app/start/LandingStart.tsx",
      "src/features/home/HomeGoToMarketLanding.tsx",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

    for (const source of sources) {
      expect(source).not.toContain("Developer-Hinweis");
      expect(source).not.toContain("Runtime-basiert");
      expect(source).not.toContain("/demo/");
    }
  });

  it("keeps the productive start route free of demo, seed and localStorage landing fallbacks", () => {
    const startPageSource = readFileSync(resolve(process.cwd(), "src/app/start/page.tsx"), "utf8");
    const landingSource = readFileSync(resolve(process.cwd(), "src/app/start/LandingStart.tsx"), "utf8");
    const splitLandingSource = readFileSync(
      resolve(process.cwd(), "src/features/home/HomeGoToMarketLanding.tsx"),
      "utf8",
    );

    expect(startPageSource).not.toContain("selectExamples");
    expect(startPageSource).not.toContain("seedKey");
    expect(startPageSource).not.toContain("/demo/");
    expect(landingSource).not.toContain("localStorage");
    expect(landingSource).not.toContain("/demo/");
    expect(splitLandingSource).not.toContain("/demo/");
    expect(splitLandingSource).not.toContain("/brand/voxy/");
  });
});
