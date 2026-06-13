import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LiveMediaKitPage from "@/app/live/[campaignId]/media-kit/page";

describe("live media kit contract", () => {
  it("renders a review-first media kit for live campaigns", async () => {
    const tree = await LiveMediaKitPage({
      params: Promise.resolve({ campaignId: "demo-pflege-vor-ort" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="live-media-kit"');
    expect(html).toContain("Media-Kit");
    expect(html).toContain("Pflege vor Ort 2026");
    expect(html).toContain("Artikel-Embed-Preview");
    expect(html).toContain("Newsletter-Link-Text");
    expect(html).toContain("Social-Karten-Text");
    expect(html).toContain("Print-/Poster-Hinweis");
    expect(html).toContain("/live/demo-pflege-vor-ort");
    expect(html).toContain("/live/demo-pflege-vor-ort?source=qr");
    expect(html).toContain("/live/demo-pflege-vor-ort/host");
    expect(html).toContain("/live/demo-pflege-vor-ort/report");
    expect(html).toContain("QR-Vorschau öffnen");
    expect(html).toContain("Entwurf / Live-Einstieg / Review-first");
    expect(html).toContain("Quellenlage offen");
    expect(html).toContain("Prüfung empfohlen");
    expect(html).toContain("Keine Drittanbieter-Tracker oder externen Embed-Skripte.");
    expect(html).toContain("Kein Newsletter-Versand, kein Posting und kein externer Connector.");
    expect(html).not.toContain(">Posten<");
    expect(html).not.toContain(">Versenden<");
    expect(html).not.toContain(">Veröffentlichen<");
    expect(html).not.toContain("<script");
  });

  it("shows a safe fallback for unknown campaign ids", async () => {
    const tree = await LiveMediaKitPage({
      params: Promise.resolve({ campaignId: "unbekannte-media-kit-campaign" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="live-media-kit-missing"');
    expect(html).toContain("Media-Kit-Vorschau nicht gefunden");
    expect(html).toContain('href="/live/unbekannte-media-kit-campaign"');
    expect(html).toContain('href="/live/unbekannte-media-kit-campaign/host"');
  });
});
