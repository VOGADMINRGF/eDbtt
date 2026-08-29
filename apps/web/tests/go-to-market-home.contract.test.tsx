import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import LandingStart from "@/app/start/LandingStart";
import {
  buildFreeBallotStartHref,
  GO_TO_MARKET_PACKAGING,
  GO_TO_MARKET_TEMPLATES,
} from "@features/pricing/goToMarketPackaging";

vi.mock("@/context/LocaleContext", () => ({
  useLocale: () => ({ locale: "de" }),
}));

describe("GO-TO-MARKET-01 homepage contract", () => {
  it("renders the simple public entry journey without internal product terms", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Eine Frage. Viele Perspektiven. Ein klareres Bild.");
    expect(html).toContain("Mitmachen");
    expect(html).toContain("Etwas starten");
    expect(html).toContain("Schnell deine Meinung abgeben");
    expect(html).toContain("Eine eigene Frage öffnen");
    expect(html).toContain("direkt ausprobieren");
    expect(html).toContain("Nicht nur Antworten sammeln");
    expect(html).toContain("Kostenlos starten");
    expect(html).toContain("Nichts geht automatisch online");
    expect(html).toContain("Voxy bleibt optional");
    expect(html).not.toContain("Anlassraum");
    expect(html).not.toContain("Orchestrator");
    expect(html).not.toContain("Review-first");
    expect(html).not.toContain("Analysefortschritt");
  });

  it("keeps the free guideline and broadly usable templates in one truthful configuration", () => {
    expect(GO_TO_MARKET_PACKAGING).toMatchObject({
      freeParticipantGuideline: 30,
      freeUseIsAvailable: true,
      guidelineIsHardLimit: false,
      checkoutIsAvailable: false,
      publishedPricesAreAvailable: false,
    });
    expect(GO_TO_MARKET_TEMPLATES).toHaveLength(5);
    expect(GO_TO_MARKET_TEMPLATES[0]?.title.de).toBe("Prioritäten gemeinsam klären");
    expect(buildFreeBallotStartHref("member-priorities")).toBe(
      "/runden/new?gtm=1&source=homepage&template=member-priorities",
    );
  });

  it("connects homepage and swipe participation to the existing question-first start flow", () => {
    const landingSource = readFileSync(
      resolve(process.cwd(), "src/features/home/HomeGoToMarketLanding.tsx"),
      "utf8",
    );
    const swipesSource = readFileSync(
      resolve(process.cwd(), "src/app/swipes/SwipesClient.tsx"),
      "utf8",
    );
    const formSource = readFileSync(
      resolve(process.cwd(), "src/app/runden/new/AnlassraumSetupForm.tsx"),
      "utf8",
    );
    const prePublishSource = readFileSync(
      resolve(process.cwd(), "src/app/runden/new/AnlassraumPrePublishCheck.tsx"),
      "utf8",
    );

    expect(landingSource).toContain("buildFreeBallotStartHref");
    expect(landingSource).toContain('href="/swipes"');
    expect(swipesSource).toContain('buildFreeBallotStartHref(undefined, "swipes-outcome")');
    expect(formSource).toContain("getGoToMarketTemplate");
    expect(prePublishSource).toContain("Kostenlos als Entwurf speichern");
    expect(formSource).toContain("Es wurde nichts veröffentlicht");
  });
});