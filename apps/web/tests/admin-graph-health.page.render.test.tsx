import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import AdminGraphHealthPage from "@/app/admin/graph/health/page";

describe("admin-graph-health.page.render", () => {
  it("renders the honest graph health headings", () => {
    const html = renderToStaticMarkup(<AdminGraphHealthPage />);
    expect(html).toContain("Graph Health");
    expect(html).toContain("Repairs öffnen");
    expect(html).toContain("Nächste Aktionen");
  });
});
