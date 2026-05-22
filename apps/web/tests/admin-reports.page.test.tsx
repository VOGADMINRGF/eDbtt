import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import AdminReportsPage from "@/app/admin/reports/page";

describe("admin reports page", () => {
  it("renders real archive navigation and disables report buttons without input", () => {
    const html = renderToStaticMarkup(<AdminReportsPage />);

    expect(html).toContain("Reports Explorer");
    expect(html).toContain('href="/archiv"');
    expect(html).toContain("Bitte zuerst einen Topic-Slug eingeben.");
    expect(html).toContain("Bitte zuerst eine Region-ID eingeben.");
    expect(html.match(/<button[^>]*disabled=/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
