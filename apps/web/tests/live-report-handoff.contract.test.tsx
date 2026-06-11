import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LiveReportHandoffPage from "@/app/live/[campaignId]/report/page";

describe("live report handoff contract", () => {
  it("renders a review-first report handoff for live campaigns", async () => {
    const tree = await LiveReportHandoffPage({
      params: Promise.resolve({ campaignId: "demo-pflege-vor-ort" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="live-report-handoff"');
    expect(html).toContain("Report-Entwurf");
    expect(html).toContain("Review nötig");
    expect(html).toContain("Nicht veröffentlicht");
    expect(html).toContain('data-testid="live-report-handoff-summary"');
    expect(html).toContain("Pflege vor Ort 2026");
    expect(html).toContain("Offene Fragen");
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Gegenpositionen / Konfliktlinien");
    expect(html).toContain("Für Review vormerken");
    expect(html).toContain("Rückfrage vorbereiten");
    expect(html).toContain("Factcheck anfragen");
    expect(html).toContain("Dossier-Entwurf vorbereiten");
    expect(html).toContain("Anlassraum-Entwurf vorbereiten");
    expect(html).toContain("Report-Vorschau");
    expect(html).toContain('href="/live/demo-pflege-vor-ort"');
    expect(html).toContain('href="/live/demo-pflege-vor-ort/host"');
    expect(html).toContain('href="/live/demo-pflege-vor-ort/media-kit"');
    expect(html).toContain("guarded=true");
    expect(html).toContain("Keine automatische Verifikation.");
    expect(html).toContain("Kein Graph-Merge ohne Review.");
    expect(html).not.toContain(">Veröffentlichen<");
    expect(html).not.toContain(">Abstimmung starten<");
    expect(html).not.toContain(">Graph übernehmen<");
    expect(html).not.toContain(">Verifiziert<");
  });

  it("shows a safe fallback for unknown campaign ids", async () => {
    const tree = await LiveReportHandoffPage({
      params: Promise.resolve({ campaignId: "unbekannte-report-campaign" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="live-report-handoff-missing"');
    expect(html).toContain("Report-Entwurf nicht gefunden");
    expect(html).toContain('href="/live/unbekannte-report-campaign/host"');
    expect(html).toContain('href="/live/unbekannte-report-campaign"');
    expect(html).toContain("Live-Einstieg öffnen");
  });
});
