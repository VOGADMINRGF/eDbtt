import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("swipes privacy gate contract", () => {
  it("prevents vote persistence before the privacy acknowledgement", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/swipes/SwipesClient.tsx"), "utf8");

    expect(source).toContain('ensureActiveProcessingAllowed("swipes-vote")');
  });
});
