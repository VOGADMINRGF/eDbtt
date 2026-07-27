import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingAdminPage from "@/app/admin/marketing/page";
import { flattenNavItems } from "@/app/admin/adminNav";

describe("admin marketing content operations dashboard", () => {
  it("shows concrete posts and videos with explicit operational data", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Marketing-Zentrale");
    expect(html).toContain("Nächste Beiträge &amp; Videos");
    expect(html).toContain("Debattenstand der Woche · Carousel");
    expect(html).toContain("Voxy erklärt · Was ist ein Debattenstand?");
    expect(html).toContain("Was hat sich in dieser Debatte wirklich verändert?");
    expect(html).toContain("Instagram, LinkedIn, Facebook");
    expect(html).toContain("TikTok, Instagram Reels, YouTube Shorts");
    expect(html).toContain("Inhalt und Quellenbezug prüfen");
    expect(html).toContain("Script, Visual und Untertitel prüfen");
    expect(html).toContain("Noch nicht terminiert");
    expect(html).toContain("view=review_ready");
    expect(html).toContain("view=approved");
    expect(html).toContain("view=scheduled");
    expect(html).toContain("view=published");

    expect(html).not.toContain("Deine Entscheidung nötig");
    expect(html).not.toContain("Produktbeleg");
    expect(html).not.toContain("An Recherche weitergeben");
    expect(html).not.toContain("Evidence");
    expect(html).not.toContain("docs/marketing/");
  });

  it("does not invent publications", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de", view: "published" }) }),
    );

    expect(html).toContain("Noch nichts veröffentlicht");
    expect(html).toContain("Aktuell existiert noch kein belegter veröffentlichter Beitrag");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });

  it("renders a selected content item with full copy, ownership and next action", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({
        searchParams: Promise.resolve({ lang: "de", item: "MCO-CONTENT-02-DE-01" }),
      }),
    );

    expect(html).toContain("Beitragsdetails");
    expect(html).toContain("Caption-Entwurf");
    expect(html).toContain("Was hat sich in dieser Debatte wirklich verändert?");
    expect(html).toContain("Inhalt und Quellenbezug prüfen");
    expect(html).toContain("Debattenstand ansehen");
    expect(html).toContain("Text, Visual, Quellenbezug und CTA prüfen und anschließend freigeben.");
    expect(html).toContain("/admin/editorial/queue");
  });

  it("renders English content operations copy", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({
        searchParams: Promise.resolve({ lang: "en", item: "MCO-CONTENT-02-DE-01" }),
      }),
    );

    expect(html).toContain("Marketing centre");
    expect(html).toContain("Next posts &amp; videos");
    expect(html).toContain("Caption draft");
    expect(html).toContain("Ready for review");
    expect(html).toContain("Nothing published yet");
    expect(html).not.toContain("Your decision required");
    expect(html).not.toContain("Proof missing");
  });

  it("remains discoverable in the existing admin navigation", () => {
    const marketingItem = flattenNavItems().find((item) => item.href === "/admin/marketing");

    expect(marketingItem).toMatchObject({
      label: "Marketing-Zentrale",
      description: "Kampagnen steuern, Ergebnisse prüfen, Arbeit delegieren",
    });
  });
});
