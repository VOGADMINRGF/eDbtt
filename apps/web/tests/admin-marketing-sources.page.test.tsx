import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingSourcesPage from "@/app/admin/marketing/sources/page";

describe("admin marketing sources decision workspace", () => {
  it("shows the real allowlist, coverage and provider decision status in German", async () => {
    const html = renderToStaticMarkup(
      await MarketingSourcesPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Quellen &amp; Themen");
    expect(html).toContain("Live-Erfassung");
    expect(html).toContain(">Aus<");
    expect(html).toContain(">29<");
    expect(html).toContain(">560<");
    expect(html).toContain("Top 20");
    expect(html).toContain("International");
    expect(html).toContain("Europäische Union");
    expect(html).toContain("Neun Nachbarländer");
    expect(html).toContain("16 Bundesländer");
    expect(html).toContain("GDELT Cloud ist nur Kandidat");
    expect(html).toContain("Konkrete Source-Allowlist");
    expect(html).toContain("Freigabe erforderlich");
    expect(html).toContain('href="/admin/regions"');
    expect(html).not.toContain('href="/admin/marketing/connections');
    expect(html).not.toContain('href="/admin/marketing/topics');
    expect(html).not.toContain("Letzter Sync");
    expect(html).not.toContain("Demo-Thema");
  });

  it("renders the English decision and coverage view", async () => {
    const html = renderToStaticMarkup(
      await MarketingSourcesPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Sources &amp; topics");
    expect(html).toContain("Live ingestion");
    expect(html).toContain("Planned coverage");
    expect(html).toContain("Nine neighbouring countries");
    expect(html).toContain("16 German states");
    expect(html).toContain("Concrete source allowlist");
    expect(html).toContain("Approval required");
    expect(html).toContain("Manage regional sources");
  });
});
