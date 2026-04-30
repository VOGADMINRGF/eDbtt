import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing communities entry bridge", () => {
  it("renders kommunen segment as B2G bridge and links to canonical configurator", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "kommunen" } }));

    expect(html).toContain("Kommunen &amp; öffentliche Auftraggeber");
    expect(html).toContain("vergabefähige Beteiligungsleistungen");
    expect(html).toContain("Zum B2G-Konfigurator");
    expect(html).toContain("/pricing/institutionen?segment=kommunen#guided-selection");
    expect(html).toContain("Beteiligungs-Check");
    expect(html).toContain("Dossier &amp; Beteiligungsrunde");
    expect(html).toContain("Beteiligungsbetrieb Kommune");
    expect(html).toContain("Rahmenvertrag / Vergabepaket");
  });

  it("avoids rendering kommunen as a second full monthly package grid", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "kommunen" } }));

    expect(html).not.toContain("Kommunen · Paketübersicht");
    expect(html).not.toContain("Kommune / Verwaltung Aktivierung");
    expect(html).not.toContain("Kommune / Verwaltung Betrieb Plus");
  });
});

