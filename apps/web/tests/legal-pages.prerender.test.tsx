import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrivatsphaerePage from "@/app/privatsphaere/page";
import PrivacyDossierPage from "@/app/datenschutz-dossier/page";

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
});
