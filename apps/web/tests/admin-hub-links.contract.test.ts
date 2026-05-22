import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = resolve(process.cwd(), "src/app/admin");

const HUB_SOURCES = [
  "page.tsx",
  "review/page.tsx",
  "region/page.tsx",
  "regions/page.tsx",
  "feeds/page.tsx",
  "feeds/drafts/page.tsx",
  "feeds/anlassraum/page.tsx",
  "feeds/anlassraum/AdminAnlassraumPageClient.tsx",
  "users/page.tsx",
  "graph/health/page.tsx",
  "graph/repairs/page.tsx",
  "responsibility/page.tsx",
  "editorial/queue/page.tsx",
  "editorial/published/page.tsx",
  "reports/page.tsx",
  "support/page.tsx",
  "pricing/orders/page.tsx",
];

describe("admin hub links contract", () => {
  it("keeps audited operator hubs free of placeholder href targets", () => {
    HUB_SOURCES.forEach((relativePath) => {
      const source = readFileSync(resolve(APP_DIR, relativePath), "utf8");
      expect(source).not.toContain('href="#"');
    });
  });

  it("keeps known non-action CTAs visibly disabled or explained", () => {
    const reportsSource = readFileSync(resolve(APP_DIR, "reports/page.tsx"), "utf8");
    const usersSource = readFileSync(resolve(APP_DIR, "users/page.tsx"), "utf8");
    const responsibilitySource = readFileSync(resolve(APP_DIR, "responsibility/page.tsx"), "utf8");

    expect(reportsSource).toContain("disabled={!canOpenTopic}");
    expect(reportsSource).toContain("disabled={!canOpenRegion}");
    expect(usersSource).toContain('aria-disabled="true"');
    expect(responsibilitySource).toContain('aria-disabled="true"');
  });
});
