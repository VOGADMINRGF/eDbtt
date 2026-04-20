import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("initiative-nav-label.contract", () => {
  it("uses initiative wording instead of movement wording in primary navigation", () => {
    const siteHeaderSource = readFileSync(resolve(process.cwd(), "src/app/(components)/SiteHeader.tsx"), "utf8");

    expect(siteHeaderSource).toContain('label: "Zur Initiative"');
    expect(siteHeaderSource).not.toContain('label: "Zur Bewegung"');
  });
});

