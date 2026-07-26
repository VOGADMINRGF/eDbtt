import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingAdminPage from "@/app/admin/marketing/page";
import { flattenNavItems } from "@/app/admin/adminNav";

describe("admin marketing registry surface", () => {
  it("renders the German read-only registry with all canonical sections", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Marketing Registry");
    expect(html).toContain("read_only");
    expect(html).toContain("Opportunities");
    expect(html).toContain("Marketingkampagnen");
    expect(html).toContain("Brandprofile");
    expect(html).toContain("Aktuelle Evidenz");
    expect(html).toContain("VOG Themenradar");
    expect(html).toContain("Beteiligungskampagnen");
    expect(html).toContain("keine Freigabe-, Upload- oder Publishing-Aktion");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Asset hochladen");
  });

  it("renders English UI copy without changing registry truth", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Central read-only view");
    expect(html).toContain("Marketing campaigns");
    expect(html).toContain("Brand profiles");
    expect(html).toContain("Recent evidence");
    expect(html).toContain("no approval, upload or publishing action");
    expect(html).toContain("CAM-EDB-01");
  });

  it("is discoverable in the existing admin navigation", () => {
    const marketingItem = flattenNavItems().find((item) => item.href === "/admin/marketing");

    expect(marketingItem).toMatchObject({
      label: "Marketing Registry",
      description: "Opportunities, Kampagnen, Assets und Brands",
    });
  });
});
