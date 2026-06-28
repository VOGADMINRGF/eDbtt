import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("initiative-nav-label.contract", () => {
  it("uses initiative wording instead of movement wording in footer navigation", () => {
    const siteFooterSource = readFileSync(resolve(process.cwd(), "src/components/SiteFooter.tsx"), "utf8");

    expect(siteFooterSource).toContain('label: "Zur Initiative"');
    expect(siteFooterSource).not.toContain('label: "Zur Bewegung"');
  });
});
