import { describe, expect, it } from "vitest";
import config from "../next.config";

describe("Next.js PDF parser deployment contract", () => {
  it("keeps pdf-parse external so its optional native canvas dependency is available at runtime", () => {
    expect(config.serverExternalPackages).toContain("pdf-parse");
  });
});
