import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import ThemenradarAdminPage from "@/app/admin/themenradar/page";

describe("themenradar-darkmode.contract", () => {
  it("keeps dark-mode class hooks and css-variable based color system", () => {
    mockNavigation.params = new URLSearchParams({
      entryIntent: "issue_signal",
      signal: "Signaltext",
      title: "Thema",
    });

    const html = renderToStaticMarkup(<ThemenradarAdminPage />);

    expect(html).toContain("rgb(var(--card))");
    expect(html).toContain("rgb(var(--border))");
    expect(html).toContain("dark:border-sky-900/50");
    expect(html).toContain("dark:bg-sky-950/30");
    expect(html).toContain("dark:text-sky-200");
  });
});
