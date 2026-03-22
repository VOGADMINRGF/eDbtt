import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminFeedDraftsPage from "@/app/admin/feeds/drafts/page";
import { LocaleProvider } from "@/context/LocaleContext";

function renderPage() {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale="de">
      <AdminFeedDraftsPage />
    </LocaleProvider>,
  );
}

describe("admin feed drafts page", () => {
  it("renders operator-first sections with candidate list before maintenance blocks", () => {
    const html = renderPage();

    expect(html).toContain("Signal-Entwürfe: Anlassraum-first Warteschlange");
    expect(html).toContain("Primärquellen bleiben die fachliche Basis");
    expect(html).toContain("Kandidatenfilter");
    expect(html).toContain("Kandidatenliste");
    expect(html).toContain("Manuell via /create fortsetzen");
    expect(html).toContain("Sammelprüfung (sekundär)");
    expect(html).toContain("Legacy-Backfill (nachgeordnete Wartungsausnahme)");

    const candidateIndex = html.indexOf("Kandidatenliste");
    const bulkIndex = html.indexOf("Sammelprüfung (sekundär)");
    const legacyIndex = html.indexOf("Legacy-Backfill (nachgeordnete Wartungsausnahme)");

    expect(candidateIndex).toBeGreaterThan(-1);
    expect(bulkIndex).toBeGreaterThan(candidateIndex);
    expect(legacyIndex).toBeGreaterThan(candidateIndex);
  });

  it("renders an actionable empty state hint for narrow filters", () => {
    const html = renderPage();

    expect(html).toContain("Keine Entwürfe für die aktuellen Filter. Prüfe, ob Filter zu eng sind");
    expect(html).toContain("Feed-Leitstand");
  });
});
