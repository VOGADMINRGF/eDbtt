import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const APP_DIR = path.resolve(process.cwd(), "src/app");

describe("admin dashboard graph repairs link contract", () => {
  it("does not deep-link Graph Repairs into a stale pending-only filter", () => {
    const adminPage = readFileSync(path.join(APP_DIR, "admin/page.tsx"), "utf8");
    expect(adminPage).toContain('href: "/admin/graph/repairs"');
    expect(adminPage).not.toContain('"/admin/graph/repairs?status=pending"');
    expect(adminPage).toContain("Graph Repairs (aktiv)");
  });

  it("keeps the admin landing focused on operator routes instead of fake KPI defaults", () => {
    const adminPage = readFileSync(path.join(APP_DIR, "admin/page.tsx"), "utf8");
    expect(adminPage).toContain("Ruhige Operator-Konsole");
    expect(adminPage).toContain("Nächste sichere Schritte");
    expect(adminPage).toContain("Review Queue");
    expect(adminPage).toContain('getOperatorWorkbenchSurface("pricingOrders")');
    expect(adminPage).not.toContain('href="#"');
  });
});
