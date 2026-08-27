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
  it("renders the complete public conversion journey without internal product terms", () => {
    const html = renderToStaticMarkup(<LandingStart />);

    expect(html).toContain("Direkt ausprobieren");
    expect(html).toContain("Vereine");
    expect(html).toContain("Bürgerinitiativen &amp; lokale Gruppen");
    expect(html).toContain("Verbände &amp; Netzwerke");
    expect(html).toContain("Organisationen &amp; Kommunen");
    expect(html).toContain("Frage stellen");
    expect(html).toContain("Link teilen");
    expect(html).toContain("Positionen verstehen");
    expect(html).toContain("Mehr als ein Prozentwert");
    expect(html).toContain("Kostenlos starten");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("KI unterstützt gekennzeichnet und entscheidet nicht autonom");
    expect(html).not.toContain("Anlassraum");
    expect(html).not.toContain("Dossier");
    expect(html).not.toContain("Orchestrator");
    expect(html).not.toContain("Review-first");
  });

  it("keeps the free guideline and templates in one truthful configuration", () => {
    expect(GO_TO_MARKET_PACKAGING).toMatchObject({
      freeParticipantGuideline: 30,
      freeUseIsAvailable: true,
      guidelineIsHardLimit: false,
      checkoutIsAvailable: false,
      publishedPricesAreAvailable: false,
    });
    expect(GO_TO_MARKET_TEMPLATES).toHaveLength(5);
    expect(buildFreeBallotStartHref("member-priorities")).toBe(
      "/runden/new?gtm=1&source=homepage&template=member-priorities",
    );
  });

  it("connects homepage and swipe participation to the existing draft-first create route", () => {
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
    expect(swipesSource).toContain('buildFreeBallotStartHref(undefined, "swipes-outcome")');
    expect(formSource).toContain("getGoToMarketTemplate");
    expect(prePublishSource).toContain("Kostenlos als Entwurf speichern");
    expect(formSource).toContain("Es wurde nichts veröffentlicht");
  });
});
