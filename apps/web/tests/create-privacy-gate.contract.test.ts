import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("create privacy gate contract", () => {
  it("guards create analyze, save and handoff actions behind the privacy acknowledgement", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");

    expect(source).toContain('ensureActiveProcessingAllowed("create-start")');
    expect(source).toContain('ensureActiveProcessingAllowed("create-continue")');
    expect(source).toContain('ensureActiveProcessingAllowed("create-save")');
    expect(source).toContain('ensureActiveProcessingAllowed(`create-handoff:${selectedAction}`)');
  });
});
