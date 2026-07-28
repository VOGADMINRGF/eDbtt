import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/marketing/review",
  useSearchParams: () => new URLSearchParams("lang=de"),
}));

import MarketingWorkspaceLayout from "@/app/admin/marketing/layout";
import MarketingLoading from "@/app/admin/marketing/loading";

describe("admin marketing workspace shell", () => {
  it("keeps the real review route permanently visible with its current count", () => {
    const html = renderToStaticMarkup(
      <MarketingWorkspaceLayout>
        <div>Workspace content</div>
      </MarketingWorkspaceLayout>,
    );

    expect(html).toContain("Marketing-Arbeitsbereich");
    expect(html).toContain("Cockpit");
    expect(html).toContain("Kampagnen");
    expect(html).toContain("Inhalte &amp; Freigaben");
    expect(html).toContain(">2<");
    expect(html).toContain("Ergebnisse");
    expect(html).toContain("/admin/marketing/review?lang=de");
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain("/admin/marketing/topics");
    expect(html).not.toContain("/admin/marketing/connections");
  });

  it("renders a local loading state instead of an empty transition", () => {
    const html = renderToStaticMarkup(<MarketingLoading />);

    expect(html).toContain("Marketing-Arbeitsbereich wird geladen");
    expect(html).toContain("Navigation und Kontext bleiben sichtbar");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toBe("");
  });
});
