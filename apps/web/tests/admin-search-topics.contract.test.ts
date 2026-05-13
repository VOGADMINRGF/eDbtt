import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin search topics contract", () => {
  it("keeps Themenradar items searchable in route, finder and page filters", () => {
    const searchRoute = readFileSync(
      resolve(process.cwd(), "src/app/api/admin/search/route.ts"),
      "utf8",
    );
    const searchButton = readFileSync(
      resolve(process.cwd(), "src/app/admin/AdminSearchButton.tsx"),
      "utf8",
    );
    const themenradarPage = readFileSync(
      resolve(process.cwd(), "src/app/admin/themenradar/page.tsx"),
      "utf8",
    );

    expect(searchRoute).toContain("listThemenradarItems");
    expect(searchRoute).toContain('group: "Themen"');
    expect(searchButton).toContain('"Themen"');
    expect(themenradarPage).toContain('data-testid="themenradar-query-filter"');
    expect(themenradarPage).toContain("Suche nach Titel, ID, Status, Quelle oder Verknüpfung");
  });
});
