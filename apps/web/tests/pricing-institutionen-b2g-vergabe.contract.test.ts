import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderMunicipalPage() {
  const element = await InstitutionalPricingPage({
    searchParams: {
      segment: "kommunen",
    },
  });
  return renderToStaticMarkup(element);
}

describe("pricing-institutionen-b2g-vergabe.contract", () => {
  it("shows municipal procurement package block with four service depths", async () => {
    const html = await renderMunicipalPage();

    expect(html).toContain("Kommunaler B2G-Modus");
    expect(html).toContain("Leistungsrahmen");
    expect(html).toContain("Vergabe- &amp; Ausschreibungspakete");
    expect(html).toContain("Beteiligungs-Check");
    expect(html).toContain("Dossier &amp; Beteiligungsrunde");
    expect(html).toContain("Beteiligungsbetrieb Kommune");
    expect(html).toContain("Rahmenvertrag / Vergabepaket");
    expect(html).toContain("Empfohlener Betriebs- und Preisrahmen");
    expect(html).toContain("Abrechnungsmodus");
    expect(html).not.toContain("Empfohlene Konfiguration");

    const procurementIndex = html.indexOf("Vergabe- &amp; Ausschreibungspakete");
    const frameIndex = html.indexOf("Empfohlener Betriebs- und Preisrahmen");
    expect(procurementIndex).toBeGreaterThan(-1);
    expect(frameIndex).toBeGreaterThan(-1);
    expect(procurementIndex).toBeLessThan(frameIndex);
  });

  it("uses procurement wording and completion handoff for municipal CTAs", async () => {
    const html = await renderMunicipalPage();

    expect(html).toContain("Leistungsbeschreibung");
    expect(html).toContain("Losstruktur");
    expect(html).toContain("Kostenvoranschlag");
    expect(html).toContain("Start / kleiner Leistungsbaustein");
    expect(html).toContain("Rahmenvertrag geeignet");
    expect(html).toContain("Ergebnisdokumentation");
    expect(html).toContain("Kommunale Einordnung vor dem Paket");
    expect(html).toContain("Projektpakete schalten nur explizit zugewiesene Leistungen frei.");
    expect(html).toContain("Finanzierung erzeugt weder");
    expect(html).toContain("Regionaler Anlass / Gebiet");
    expect(html).toContain("formelle oder informelle Beteiligung");
    expect(html).toContain("B2B- und B2G-Preise verstehen sich zzgl. MwSt.");
    expect(html).toContain("segment=kommunen");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("completion=conversation_request");
    expect(html).not.toContain(">Direkt bestellen<");
  });

  it("keeps legal guardrails explicit and avoids absolute legal claims", async () => {
    const html = await renderMunicipalPage();

    expect(html).toContain("keine Rechtsberatung");
    expect(html).toContain("keine automatische Ausschreibung");
    expect(html).toContain("ersetzt keine formelle Beteiligungspflicht");
    expect(html).not.toContain("rechtssicher");
    expect(html).not.toContain("automatisch ausschreiben");
    expect(html).not.toContain("Vergabeberatung");
  });
});
