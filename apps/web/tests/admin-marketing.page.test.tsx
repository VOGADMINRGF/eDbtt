import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingAdminPage from "@/app/admin/marketing/page";
import { flattenNavItems } from "@/app/admin/adminNav";

describe("admin marketing campaign control system", () => {
  it("centres campaigns, distribution, data coverage and the contextual assistant", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Kampagnen- &amp; Posting-Steuerung");
    expect(html).toContain("B2C");
    expect(html).toContain("B2B");
    expect(html).toContain("B2G");
    expect(html).toContain("Kampagnenportfolio");
    expect(html).toContain("Gestreute Beiträge und Varianten");
    expect(html).toContain("Messdaten und Datenquellen");
    expect(html).toContain("Marketing-Assistent");
    expect(html).toContain("Nur Empfehlungen");
    expect(html).toContain("2 Inhalte warten auf Prüfung");
    expect(html).toContain("Messplan und Datenlage prüfen");
    expect(html).toContain("Debattenstand der Woche");
    expect(html).toContain("Voxy erklärt");
    expect(html).toContain("Nicht verbunden / keine verifizierten Daten");
    expect(html).not.toContain("Weitere Marketingmaterialien");
    expect(html).not.toContain("docs/marketing/");
  });

  it("filters the portfolio by B2G without mixing unrelated B2C content", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de", segment: "b2g" }) }),
    );

    expect(html).toContain("Beteiligung nachvollziehbar organisieren");
    expect(html).toContain("Kommunen");
    expect(html).not.toContain("Voxy erklärt · Was ist ein Debattenstand?");
  });

  it("uses selected campaign context and real review links", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({
        searchParams: Promise.resolve({ lang: "de", campaign: "CAM-CONTENT-02" }),
      }),
    );

    expect(html).toContain("Kampagnendetails");
    expect(html).toContain("Den Debattenstand als wiederkehrendes");
    expect(html).toContain("Begonnene Produktaktionen");
    expect(html).toContain("Instagram, LinkedIn, Facebook, Newsletter, Meta Ads");
    expect(html).toContain("1 Inhalte dieser Kampagne warten auf Prüfung");
    expect(html).toContain("Kampagneninhalte prüfen");
    expect(html).toContain("/admin/editorial/queue");
    expect(html).toContain("/admin/marketing/insights?lang=de&amp;campaign=CAM-CONTENT-02");
  });

  it("keeps missing measurements honest instead of rendering zero performance", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Noch keine verifizierten Leistungsdaten");
    expect(html).toContain("Noch keine Performance-Datenquelle ist verbunden.");
    expect(html).toContain("Der Assistent verändert, terminiert oder veröffentlicht nichts selbstständig.");
    expect(html).not.toContain("0 Likes");
    expect(html).not.toContain("0 Shares");
    expect(html).not.toContain("ROI");
  });

  it("renders the English operator and assistant view", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Campaign &amp; posting control");
    expect(html).toContain("Campaign portfolio");
    expect(html).toContain("Distributed content and variants");
    expect(html).toContain("Measurement data and sources");
    expect(html).toContain("Marketing assistant");
    expect(html).toContain("Recommendations only");
    expect(html).toContain("Not connected / no verified data");
  });

  it("remains discoverable in the existing admin navigation", () => {
    const marketingItem = flattenNavItems().find((item) => item.href === "/admin/marketing");

    expect(marketingItem).toMatchObject({
      label: "Marketing-Zentrale",
      description: "Kampagnen steuern, Ergebnisse prüfen, Arbeit delegieren",
    });
  });
});
