import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import AdminGraphRepairsPage from "@/app/admin/graph/repairs/page";

describe("admin-graph-repairs.page.render", () => {
  it("renders the repairs shell and diagnostics action", () => {
    const html = renderToStaticMarkup(<AdminGraphRepairsPage />);
    expect(html).toContain("Graph Repairs");
    expect(html).toContain("Diagnose aktualisieren");
    expect(html).toContain("Alle Typen");
  });
});
