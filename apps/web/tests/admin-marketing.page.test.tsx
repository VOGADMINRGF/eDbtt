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
    expect(html).toContain("Marketing-Inhalte prüfen");
    expect(html).toContain("Bestandsdaten");
    expect(html).toContain("Empfehlungssicherheit");
    expect(html).toContain("Niedrig");
    expect(html).toContain("0 von 6 Datenquellen verbunden");
    expect(html).toContain("Debattenstand der Woche");
    expect(html).toContain("Voxy erklärt");
    expect(html).toContain("/admin/marketing/review?lang=de");
    expect(html).not.toContain("/admin/editorial/queue");
    expect(html).not.toContain("25 %");
    expect(html).not.toContain("Sicherheit der Einordnung");
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

  it("uses selected campaign context and a real marketing review link", async () => {
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
    expect(html).toContain("/admin/marketing/review?campaign=CAM-CONTENT-02&amp;lang=de");
    expect(html).not.toContain("/admin/editorial/queue");
    expect(html).toContain("/admin/marketing/insights?lang=de&amp;campaign=CAM-CONTENT-02");
  });

  it("shows only the two review-ready contents when the review filter is active", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({
        searchParams: Promise.resolve({ lang: "de", contentStatus: "review_ready" }),
      }),
    );

    expect(html).toContain("Es werden ausschließlich Marketinginhalte angezeigt, die auf Prüfung warten.");
    expect(html).toContain("Debattenstand der Woche · Carousel");
    expect(html).toContain("Voxy erklärt · Was ist ein Debattenstand?");
    expect((html.match(/Marketing-Inhalte prüfen/g) ?? []).length).toBeGreaterThanOrEqual(2);
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
    expect(html).toContain("Inventory data");
    expect(html).toContain("Recommendation confidence");
    expect(html).toContain("Low");
    expect(html).toContain("0 of 6 Data sources connected");
  });

  it("remains discoverable in the existing admin navigation", () => {
    const marketingItem = flattenNavItems().find((item) => item.href === "/admin/marketing");

    expect(marketingItem).toMatchObject({
      label: "Marketing-Zentrale",
      description: "Kampagnen steuern, Ergebnisse prüfen, Arbeit delegieren",
    });
  });
});
