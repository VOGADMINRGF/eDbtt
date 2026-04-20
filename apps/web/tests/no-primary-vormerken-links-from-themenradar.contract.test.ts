import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("no-primary-vormerken-links-from-themenradar.contract", () => {
  it("keeps Themenradar free of primary /vormerken links", () => {
    const content = [
      readFileSync(resolve(process.cwd(), "src/app/admin/themenradar/page.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "src/app/admin/themenradar/[id]/page.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "../../features/themenradar/contentPrep.ts"), "utf8"),
    ].join("\n");

    expect(content).not.toContain("/vormerken");
  });
});
