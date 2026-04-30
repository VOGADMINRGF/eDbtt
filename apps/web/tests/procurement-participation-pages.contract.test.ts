import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ParticipationProcurementPage from "@/app/leistungen/buergerbeteiligung/page";
import ParticipationPartnerPage from "@/app/leistungen/partner/page";

describe("procurement participation service pages", () => {
  it("renders the procurement-ready participation service page", () => {
    const html = renderToStaticMarkup(<ParticipationProcurementPage />);

    expect(html).toContain("Vergabefaehige Buergerbeteiligung");
    expect(html).toContain("Buergerbeteiligung, die nicht im Protokoll endet.");
    expect(html).toContain("Vom Anlass zum Mandat");
    expect(html).toContain("Ausschreibungslogik");
    expect(html).toContain("Onlinebeteiligung-as-a-Service");
    expect(html).toContain('href="/pricing?segment=kommunen"');
    expect(html).toContain('href="/leistungen/partner"');
  });

  it("renders the partner route without claiming to replace moderation", () => {
    const html = renderToStaticMarkup(<ParticipationPartnerPage />);

    expect(html).toContain("Partner fuer Beteiligungsbueros");
    expect(html).toContain("Sie moderieren. eDebatte liefert die digitale Infrastruktur.");
    expect(html).toContain("Keine Konkurrenz zur Moderation");
    expect(html).toContain("Klar getrennte Verantwortung");
    expect(html).toContain("PROC-BET-02");
    expect(html).toContain('href="/leistungen/buergerbeteiligung"');
  });
});
