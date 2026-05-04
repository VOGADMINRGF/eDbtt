import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

async function renderPricing(params?: Record<string, string>) {
  const element = await PricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("/pricing canonical landing", () => {
  it("renders short decision-first private package flow without legacy tier naming", async () => {
    const html = await renderPricing();

    expect(html).toContain("Pakete &amp; Preise");
    expect(html).toContain("eDebatte Interessiert");
    expect(html).toContain("eDebatte Aktiv");
    expect(html).toContain("eDebatte Mitgestaltend");
    expect(html).toContain("Beteiligung frei: 0 €");
    expect(html).toContain("Interessiert: 4,99 €");
    expect(html).toContain("14,99 €");
    expect(html).toContain("29,99 €");
    expect(html).not.toContain("eDebatte Basis");
    expect(html).not.toContain("eDebatte Start");
    expect(html).not.toContain("eDebatte Pro");
    expect(html).not.toContain("citizenBasic");
    expect(html).not.toContain("citizenPremium");
    expect(html).not.toContain("citizenPro");
    expect(html).not.toContain("Technisches Mapping");
  });

  it("keeps hero short with public-entry CTAs", async () => {
    const html = await renderPricing();

    expect(html).toContain("Du kannst eDebatte kostenlos nutzen, Themen swipen und Hinweise einbringen.");
    expect(html).toContain("Kostenlos starten");
    expect(html).toContain("Anonym / vertraulich Hinweis geben");
    expect(html).toContain("Paket wählen");
    expect(html).toContain("Professionell nutzen");
    expect(html).toContain('href="/pricing/institutionen"');
  });

  it("keeps initiative membership logic visible in pricing decision area", async () => {
    const html = await renderPricing();

    expect(html).toContain("Nutzung ist freiwillig. eDebatte strukturiert Informationen und garantiert keine politische Umsetzung.");
    expect(html).toContain("Mitgliedschaft bleibt freiwillig und getrennt vom Paketkauf.");
    expect(html).toContain("Paketpreise bleiben unabhängig vom Mitgliedschaftsantrag gleich.");
    expect(html).toContain("Empfohlener Mitgliedsbeitrag: 5,63 €.");
    expect(html).toContain("Search Credit / Dossier Search: ca. 10 € je Credit (einzeln buchbar)");
    expect(html).toContain("Deep Research Credit: ca. 20 € je Credit (einzeln buchbar)");
    expect(html).toContain("Zur Initiative");
    expect(html).toContain("So funktioniert eDebatte");
  });

  it("keeps membership optional but non-discounted in journalism segment", async () => {
    const html = await renderPricing({ segment: "journalismus" });

    expect(html).toContain("Journalistische Pakete mit Einstiegskontingent");
    expect(html).toContain("Mitgliedschaft bleibt freiwillig und getrennt vom Paketkauf.");
    expect(html).toContain("Paketpreise bleiben unabhängig vom Mitgliedschaftsantrag gleich.");
  });

  it("keeps institutional and newsroom conditions as short secondary hint", async () => {
    const html = await renderPricing();

    expect(html).toContain("Organisationen, Kommunen, Verbände, Medien und Forschung");
    expect(html).toContain("Professionell nutzen");
  });

  it("keeps primary pricing CTAs on existing routes", async () => {
    const html = await renderPricing();

    expect(html).toContain('href="#pricing-privat"');
    expect(html).toContain('href="/community/contributions"');
    expect(html).toContain('href="/pricing/institutionen"');
    expect(html).toContain('href="/vormerken?paket=basis&amp;segment=privat"');
    expect(html).toContain('href="/vormerken?paket=start&amp;segment=privat"');
    expect(html).toContain('href="/vormerken?paket=pro&amp;segment=privat"');
    expect(html).not.toContain('href="/order?paket=');
  });

  it("keeps locale-aware links in EN mode", async () => {
    const html = await renderPricing({ lang: "en" });

    expect(html).toContain("Packages &amp; pricing");
    expect(html).toContain("Choose package");
    expect(html).toContain("Use professionally");
    expect(html).toContain('href="/pricing/institutionen?lang=en"');
    expect(html).toContain('href="/vormerken?paket=pro&amp;segment=privat&amp;lang=en"');
  });

  it("shows billing mode labels and annual preference on package cards", async () => {
    const html = await renderPricing();

    expect(html).toContain("Abrechnungsmodus:");
    expect(html).toContain("monatlich · jährliche Zahlung bevorzugt");
    expect(html).toContain("Jahreszahlung spart 15 %");
  });
});
