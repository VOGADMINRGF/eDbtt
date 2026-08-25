import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../next.config";

describe("Next.js PDF parser deployment contract", () => {
  it("keeps pdf-parse external so its optional native canvas dependency is available at runtime", () => {
    expect(config.serverExternalPackages).toContain("pdf-parse");
  });

  it("loads pdf-parse only inside the PDF extraction branch", () => {
    const source = readFileSync(
      new URL("../src/features/create/externalSourceIntake.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/^import .* from ["']pdf-parse["'];/m);
    expect(source).toContain('await import("pdf-parse")');
  });
});
