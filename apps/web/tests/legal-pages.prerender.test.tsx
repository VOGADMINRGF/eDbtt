import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrivatsphaerePage from "@/app/privatsphaere/page";
import PrivacyDossierPage from "@/app/datenschutz-dossier/page";
import DatenschutzPage from "@/app/datenschutz/page";
import BarrierefreiheitPage from "@/app/barrierefreiheit/page";
import KiNutzungPage from "@/app/ki-nutzung/page";
import ImpressumPage from "@/app/impressum/page";

describe("legal pages prerender", () => {
  it("renders /privatsphaere without runtime locale or membership dependencies", () => {
    const html = renderToStaticMarkup(<PrivatsphaerePage />);

    expect(html).toContain("Privatsphäre &amp; Datensicherheit");
    expect(html).toContain("Schnellzugriff");
    expect(html).toContain("Datenschutz");
    expect(html).toContain("Kontosicherheit");
  });

  it("renders /datenschutz-dossier with stable static sections", () => {
    const html = renderToStaticMarkup(<PrivacyDossierPage />);

    expect(html).toContain("Datenschutz-Dossier");
    expect(html).toContain("Wie eDebatte mit Eingaben, KI und Beteiligung umgeht");
    expect(html).not.toContain("Noch keine Projektdaten verfügbar.");
    expect(html.match(/<article/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
  });

  it("renders static-safe legal and info pages without locale providers", () => {
    const datenschutzHtml = renderToStaticMarkup(<DatenschutzPage />);
    const barrierefreiheitHtml = renderToStaticMarkup(<BarrierefreiheitPage />);
    const kiNutzungHtml = renderToStaticMarkup(<KiNutzungPage />);
    const impressumHtml = renderToStaticMarkup(<ImpressumPage />);

    expect(datenschutzHtml).toContain("Datenschutz");
    expect(datenschutzHtml).toContain("Verantwortliche Stelle");
    expect(barrierefreiheitHtml).toContain("Barrierefreiheit");
    expect(kiNutzungHtml).toContain("KI-Nutzung");
    expect(kiNutzungHtml).toContain("Eingesetzte Provider");
    expect(impressumHtml).toContain("Impressum");
    expect(impressumHtml).toContain("Rechtliche Hinweise");
  });
});
