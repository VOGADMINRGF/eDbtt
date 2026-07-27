import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingAdminPage from "@/app/admin/marketing/page";
import { flattenNavItems } from "@/app/admin/adminNav";

describe("admin marketing content board", () => {
  it("shows concrete posts and videos instead of development work", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Marketing-Zentrale");
    expect(html).toContain("Beiträge &amp; Videos");
    expect(html).toContain("Nächste Beiträge &amp; Videos");
    expect(html).toContain("Debattenstand der Woche · Carousel");
    expect(html).toContain("Voxy erklärt · Video-Storyboard");
    expect(html).toContain("Carousel-Post");
    expect(html).toContain("Kurzvideo / Script");
    expect(html).toContain("Instagram");
    expect(html).toContain("TikTok");
    expect(html).toContain("Zur Inhaltsprüfung");
    expect(html).toContain("/admin/editorial/queue");
    expect(html).toContain("view=review");
    expect(html).toContain("view=draft");
    expect(html).toContain("view=scheduled");
    expect(html).toContain("view=published");

    expect(html).not.toContain("Deine Entscheidung nötig");
    expect(html).not.toContain("Beleg fehlt");
    expect(html).not.toContain("Chancen");
    expect(html).not.toContain("Produktbeleg");
    expect(html).not.toContain("An Recherche weitergeben");
    expect(html).not.toContain("Evidence");
    expect(html).not.toContain("docs/marketing/");
  });

  it("shows honest empty schedule and publication states", async () => {
    const defaultHtml = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );
    const publishedHtml = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de", view: "published" }) }),
    );

    expect(defaultHtml).toContain("Noch nicht terminiert");
    expect(publishedHtml).toContain("Noch nichts veröffentlicht");
    expect(publishedHtml).toContain("Aktuell existiert noch kein belegter veröffentlichter Beitrag");
    expect(publishedHtml).not.toContain("Jetzt veröffentlichen");
  });

  it("renders a selected content item with channel, CTA and next step", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({
        searchParams: Promise.resolve({ lang: "de", asset: "MAS-CONTENT-CAROUSEL-01" }),
      }),
    );

    expect(html).toContain("Beitragsdetails");
    expect(html).toContain("Debattenstand der Woche · Carousel");
    expect(html).toContain("Instagram, LinkedIn, Facebook");
    expect(html).toContain("Debattenstand ansehen");
    expect(html).toContain("Text, Visual, Quellenbezug und CTA prüfen");
  });

  it("renders English content operations copy", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Marketing centre");
    expect(html).toContain("Posts &amp; videos");
    expect(html).toContain("Next posts &amp; videos");
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
