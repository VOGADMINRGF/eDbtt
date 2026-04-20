import { createRequire } from "module";
import { describe, it } from "vitest";

const hasPlaywright = (() => {
  try {
    const req = createRequire(import.meta.url);
    req.resolve("@playwright/test");
    return true;
  } catch {
    return false;
  }
})();

const suite = hasPlaywright ? describe : describe.skip;

suite("admin e2e (playwright)", () => {
  it("is executed in the Playwright runner when available", () => {
    // This file stays as a compatibility marker for local/CI setups
    // where Playwright is installed and run separately.
  });
});
