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

  it("does not turn missing dashboard values into fake zero KPIs", () => {
    const adminPage = readFileSync(path.join(APP_DIR, "admin/page.tsx"), "utf8");
    expect(adminPage).toContain("Nicht geladen");
    expect(adminPage).toContain("Noch keine belastbaren Paketdaten verfügbar.");
    expect(adminPage).toContain("Noch keine belastbaren Rollendaten verfügbar.");
    expect(adminPage).not.toContain("editorialCounts?.triage ?? 0");
    expect(adminPage).not.toContain("editorialCounts?.review ?? 0");
    expect(adminPage).not.toContain("packages?.reduce((a, b) => a + b.count, 0) ?? 0");
  });
});
