import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCreateHelperLinks } from "@/features/create/createSurfaceConfig";

describe("navigation initiative label contract", () => {
  it("uses initiative wording on create helper navigation in DE and EN", () => {
    const deLabels = getCreateHelperLinks("de").map((entry) => entry.label);
    const enLabels = getCreateHelperLinks("en").map((entry) => entry.label);

    expect(deLabels).toContain("Zur Initiative");
    expect(enLabels).toContain("About the initiative");

    expect(deLabels).not.toContain("Zur Bewegung");
    expect(enLabels).not.toContain("About the movement");
  });

  it("uses initiative wording on shared footer navigation", () => {
    const siteFooterSource = readFileSync(resolve(process.cwd(), "src/components/SiteFooter.tsx"), "utf8");

    expect(siteFooterSource).toContain('label: "Zur Initiative"');
    expect(siteFooterSource).not.toContain('label: "Zur Bewegung"');
  });
});
