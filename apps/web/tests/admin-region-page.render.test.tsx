import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createInMemoryRegionDataRepo, setRegionDataRepoForTests } from "@features/region";
import AdminRegionPage from "@/app/admin/region/page";

describe("admin-region-page.render", () => {
  it("renders the regional operator surface with selector and module blocks", async () => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    const html = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: {
          regionId: "region-official-01051011",
        },
      }),
    );

    expect(html).toContain('data-testid="admin-region-page"');
    expect(html).toContain('data-testid="admin-region-selector"');
    expect(html).toContain('data-testid="admin-region-summary"');
    expect(html).toContain('data-testid="admin-region-modules"');
    expect(html).toContain("Verwaltung, Akteure und Signale");
  });
});
