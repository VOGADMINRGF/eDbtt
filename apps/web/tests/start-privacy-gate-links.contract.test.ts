import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("start privacy gate link contract", () => {
  it("marks active create and participation ctas as privacy-gated triggers", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/start/LandingStart.tsx"), "utf8");

    expect((source.match(/data-requires-privacy-gate=\"true\"/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(source).toContain('href="/create?intent=check"');
    expect(source).toContain('href="/create?intent=contribute"');
    expect(source).toContain('href="/swipes"');
    expect(source).toContain('href="/create"');
  });
});
