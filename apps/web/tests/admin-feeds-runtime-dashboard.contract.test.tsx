import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminFeedsPage from "@/app/admin/feeds/page";
import { LocaleProvider } from "@/context/LocaleContext";

function renderPage() {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale="de">
      <AdminFeedsPage />
    </LocaleProvider>,
  );
}

describe("admin feeds runtime dashboard contract", () => {
  it("frames feeds as a manual-first runtime path with honest operational copy", () => {
    const html = renderPage();

    expect(html).toContain("Feed-Radar Runtime");
    expect(html).toContain("Manual-first Leitstand");
    expect(html).toContain("Nächste Aktion");
    expect(html).toContain("Öffentlicher Anschluss");
    expect(html).toContain("Letzte Läufe");
    expect(html).toContain("Scheduler-Claim bewusst ausgeschlossen");
    expect(html).toContain("Noch kein öffentlicher Anschluss vorbereitet");
  });
});
