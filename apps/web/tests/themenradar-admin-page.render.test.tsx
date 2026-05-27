import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import ThemenradarAdminPage from "@/app/admin/themenradar/page";

describe("themenradar-admin-page.render", () => {
  it("renders list/filter/operator shell markers", () => {
    const html = renderToStaticMarkup(<ThemenradarAdminPage />);

    expect(html).toContain('data-testid="themenradar-admin-page"');
    expect(html).toContain('data-testid="themenradar-filters"');
    expect(html).toContain('data-testid="themenradar-status-filter"');
    expect(html).toContain('data-testid="themenradar-source-filter"');
    expect(html).toContain('data-testid="themenradar-query-filter"');
    expect(html).toContain("Neues Thema anlegen");
    expect(html).toContain("Operator-Fläche");
    expect(html).toContain('data-testid="themenradar-autonomous-supply"');
    expect(html).toContain("Autonome Themenversorgung");
  });
});
