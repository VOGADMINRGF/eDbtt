import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarketingAdminPage from "@/app/admin/marketing/page";
import { flattenNavItems } from "@/app/admin/adminNav";

describe("admin marketing operating dashboard", () => {
  it("renders a clear German operating view with clickable metrics and existing workflow handoffs", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "de" }) }),
    );

    expect(html).toContain("Marketing-Zentrale");
    expect(html).toContain("Heute wichtig");
    expect(html).toContain("Bereit zur Umsetzung");
    expect(html).toContain("Deine Entscheidung nötig");
    expect(html).toContain("Beleg fehlt");
    expect(html).toContain("Noch keine Kampagne veröffentlicht");
    expect(html).toContain("Es werden bewusst keine Demo-Zahlen gezeigt");
    expect(html).toContain("weitergeben");
    expect(html).toContain("/admin/evidence/items");
    expect(html).toContain("/admin/editorial/queue");
    expect(html).toContain("/admin/research/tasks");
    expect(html).toContain("Fach- und Technikdetails");
    expect(html).toContain("view=ready");
    expect(html).toContain("view=decision");
    expect(html).toContain("view=proof");
    expect(html).toContain("view=published");
    expect(html).not.toContain("read_only ·");
    expect(html).not.toContain("Marketing Registry</h1>");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Marketing-Queue");
  });

  it("renders English operator copy without inventing results", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    );

    expect(html).toContain("Marketing centre");
    expect(html).toContain("Important today");
    expect(html).toContain("Your decision required");
    expect(html).toContain("No demo metrics are shown");
    expect(html).toContain("Hand off");
    expect(html).toContain("Professional and technical details");
  });

  it("renders a selected campaign with understandable blockers and materials", async () => {
    const html = renderToStaticMarkup(
      await MarketingAdminPage({
        searchParams: Promise.resolve({ lang: "de", campaign: "CAM-EDB-01" }),
      }),
    );

    expect(html).toContain("Kampagnendetails");
    expect(html).toContain("Warum eDebatte?");
    expect(html).toContain("Reale Produktscreenshots oder Produktbelege fehlen");
    expect(html).toContain("Warum eDebatte? · Onepager");
    expect(html).toContain("An Evidence weitergeben");
  });

  it("is discoverable in the existing admin navigation without changing other navigation semantics", () => {
    const marketingItem = flattenNavItems().find((item) => item.href === "/admin/marketing");

    expect(marketingItem).toMatchObject({
      label: "Marketing-Zentrale",
      description: "Kampagnen steuern, Ergebnisse prüfen, Arbeit delegieren",
    });
  });
});
