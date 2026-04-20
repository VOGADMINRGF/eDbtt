import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("themenradar-order-path-alignment.contract", () => {
  it("does not introduce legacy /vormerken as a new primary conversion path", () => {
    const files = [
      resolve(process.cwd(), "src/app/admin/themenradar/page.tsx"),
      resolve(process.cwd(), "src/app/admin/themenradar/[id]/page.tsx"),
      resolve(process.cwd(), "src/app/api/admin/themenradar/route.ts"),
      resolve(process.cwd(), "src/app/api/admin/themenradar/[id]/route.ts"),
      resolve(process.cwd(), "../../features/themenradar/contentPrep.ts"),
    ];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content.includes("/vormerken")).toBe(false);
    }
  });
});
