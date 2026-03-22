import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminFeedDraftsPage from "@/app/admin/feeds/drafts/page";

describe("admin feed drafts page", () => {
  it("renders operator-first sections with candidate list before maintenance blocks", () => {
    const html = renderToStaticMarkup(<AdminFeedDraftsPage />);

    expect(html).toContain("Signal-Drafts: Anlassraum-first Queue");
    expect(html).toContain("Primärquellen bleiben die fachliche Basis");
    expect(html).toContain("Kandidatenfilter");
    expect(html).toContain("Kandidatenliste");
    expect(html).toContain("Manuell via /create fortsetzen");
    expect(html).toContain("Bulk Review (sekundär)");
    expect(html).toContain("Legacy Backfill (nachgeordnete Maintenance-Ausnahme)");

    const candidateIndex = html.indexOf("Kandidatenliste");
    const bulkIndex = html.indexOf("Bulk Review (sekundär)");
    const legacyIndex = html.indexOf("Legacy Backfill (nachgeordnete Maintenance-Ausnahme)");

    expect(candidateIndex).toBeGreaterThan(-1);
    expect(bulkIndex).toBeGreaterThan(candidateIndex);
    expect(legacyIndex).toBeGreaterThan(candidateIndex);
  });

  it("renders an actionable empty state hint for narrow filters", () => {
    const html = renderToStaticMarkup(<AdminFeedDraftsPage />);

    expect(html).toContain("Keine Drafts für die aktuellen Filter. Prüfe, ob Filter zu eng sind");
    expect(html).toContain("Feed Control Plane");
  });
});
