import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("operator console no-fake-actions contract", () => {
  it("keeps the operator console action set on real existing routes", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/admin/operatorConsoleReadModel.ts"), "utf8");

    const hrefs = [
      "/admin/review",
      "/admin/themenradar",
      "/admin/feeds",
      "/admin/feeds#source-automation",
      "/admin/feeds#material-extraction-jobs",
      "/atlas/social-review",
      "/admin/entitlements",
      "/admin/pricing/orders",
    ];

    for (const href of hrefs) {
      expect(source).toContain(`"${href}"`);
    }

    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
      expect(href).not.toContain("#/");
      expect(href).not.toContain("://");
      expect(href).not.toBe("#");
    }
  });

  it("does not advertise fake live-posting or placeholder actions on the page", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");

    expect(source).not.toContain('href="#"');
    expect(source).not.toContain("Auto veröffentlichen");
    expect(source).not.toContain("Jetzt live posten");
    expect(source).not.toContain("OAuth verbinden");
    expect(source).toContain('href: "/admin/pricing/orders"');
    expect(source).toContain('href: "/admin/graph/repairs"');
  });
});
