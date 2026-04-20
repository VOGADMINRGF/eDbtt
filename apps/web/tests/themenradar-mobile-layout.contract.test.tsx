import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
  useParams: () => ({ id: "themenradar_1" }),
}));

import ThemenradarAdminPage from "@/app/admin/themenradar/page";
import ThemenradarDetailPage from "@/app/admin/themenradar/[id]/page";

describe("themenradar-mobile-layout.contract", () => {
  it("keeps list and detail containers overflow-safe and mobile-readable", () => {
    mockNavigation.params = new URLSearchParams();
    const listHtml = renderToStaticMarkup(<ThemenradarAdminPage />);
    const detailHtml = renderToStaticMarkup(<ThemenradarDetailPage />);

    expect(listHtml).toContain("max-w-full");
    expect(listHtml).toContain("overflow-x-hidden");
    expect(listHtml).toContain("flex flex-wrap items-center gap-2");
    expect(listHtml).not.toContain("overflow-x-auto");

    expect(detailHtml).toContain("max-w-full");
    expect(detailHtml).toContain("overflow-x-hidden");
    expect(detailHtml).not.toContain("overflow-x-auto");
  });
});
