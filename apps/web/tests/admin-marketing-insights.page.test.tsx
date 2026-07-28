import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingInsightsPage from "@/app/admin/marketing/insights/page";

describe("admin marketing insights", () => {
  it("shows scorecards and compact assistant guidance without invented performance", async () => {
    const html = renderToStaticMarkup(
      await MarketingInsightsPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Kampagnenergebnisse");
    expect(html).toContain("Datenquellen");
    expect(html).toContain("Kampagnen-Scorecards");
    expect(html).toContain("Plattform- &amp; Reichweitenintelligenz");
    expect(html).toContain("Marketing-Assistent");
    expect(html).toContain("Messplan und Datenlage prüfen");
    expect(html).toContain("Bestandsdaten verifiziert");
    expect(html).toContain("Empfehlungssicherheit");
    expect(html).toContain("Niedrig");
    expect(html).toContain("Heute sinnvoll");
    expect(html).toContain("Noch keine verifizierten Daten");
    expect(html).toContain("Nicht verbunden");
    expect(html).toContain("Debattenstand der Woche");
    expect(html).toContain("Bezahlte Werbung");
    expect(html).not.toContain("25 %");
    expect(html).not.toContain("0 Likes");
    expect(html).not.toContain("0 Shares");
    expect(html).not.toContain("ROI");
  });

  it("focuses one campaign and explains its missing measurement basis", async () => {
    const html = renderToStaticMarkup(
      await MarketingInsightsPage({
        searchParams: Promise.resolve({ lang: "de", campaign: "CAM-MUNI-09" }),
      }),
    );

    expect(html).toContain("Beteiligung nachvollziehbar organisieren");
    expect(html).toContain("B2G");
    expect(html).toContain("Lokal, Regional, National");
    expect(html).toContain("Qualifizierte Anfragen");
    expect(html).toContain("Inhalt und Briefing vorbereiten");
    expect(html).toContain("Messplan und Datenlage öffnen");
    expect(html).toContain("Es fehlen verifizierte Performance-Snapshots mit Quelle und Zeitraum.");
    expect(html).not.toContain("Kanal- und Terminplanung prüfen");
    expect(html).not.toContain("Voxy erklärt");
  });

  it("renders the English performance and assistant view", async () => {
    const html = renderToStaticMarkup(
      await MarketingInsightsPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Campaign results");
    expect(html).toContain("Campaign scorecards");
    expect(html).toContain("Platform &amp; reach intelligence");
    expect(html).toContain("Marketing assistant");
    expect(html).toContain("Inventory verified");
    expect(html).toContain("Recommendation confidence");
    expect(html).toContain("Low");
    expect(html).toContain("No verified data yet");
  });
});
