import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LiveHostCockpitPage from "@/app/live/[campaignId]/host/page";

describe("live host cockpit contract", () => {
  it("renders a review-first host cockpit for live campaigns", async () => {
    const tree = await LiveHostCockpitPage({
      params: Promise.resolve({ campaignId: "demo-pflege-vor-ort" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="live-host-cockpit"');
    expect(html).toContain("Host-Cockpit");
    expect(html).toContain("Pflege vor Ort 2026");
    expect(html).toContain('data-testid="live-host-cockpit-summary"');
    expect(html).toContain(">4<");
    expect(html).toContain(">3<");
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Bündeln");
    expect(html).toContain("Rückfrage vorbereiten");
    expect(html).toContain("Für Bericht vormerken");
    expect(html).toContain('href="/live/demo-pflege-vor-ort/report"');
    expect(html).toContain("Quellenlage offen");
    expect(html).toContain("Prüfung empfohlen");
    expect(html).toContain("Quellen geprüft");
    expect(html).toContain("Keine automatische Veröffentlichung.");
    expect(html).toContain("Keine Factcheck-Ausführung aus dieser Oberfläche.");
    expect(html).not.toContain(">Veröffentlichen<");
    expect(html).not.toContain(">Vote<");
    expect(html).not.toContain(">Verifiziert<");
  });

  it("shows a safe fallback for unknown campaign ids", async () => {
    const tree = await LiveHostCockpitPage({
      params: Promise.resolve({ campaignId: "unbekannte-host-campaign" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="live-host-cockpit-missing"');
    expect(html).toContain("Host-Cockpit nicht gefunden");
    expect(html).toContain('href="/live/unbekannte-host-campaign"');
    expect(html).toContain('href="/start"');
  });
});
