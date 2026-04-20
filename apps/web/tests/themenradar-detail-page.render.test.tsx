import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "themenradar_1" }),
}));

import ThemenradarDetailPage from "@/app/admin/themenradar/[id]/page";

describe("themenradar-detail-page.render", () => {
  it("renders the detail surface shell and stable loading contract", () => {
    const html = renderToStaticMarkup(<ThemenradarDetailPage />);

    expect(html).toContain('data-testid="themenradar-detail-page"');
    expect(html).toContain("Lade Themenradar-Details");
    expect(html).toContain("max-w-full");
    expect(html).toContain("overflow-x-hidden");
  });
});
