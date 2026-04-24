import { describe, expect, it } from "vitest";
import { buildDeepLinkUrl, normalizeDeepLinkPath } from "@/features/mobile/deepLink";

describe("mobile deep-link contract", () => {
  it("normalizes relative and absolute paths defensively", () => {
    expect(normalizeDeepLinkPath("factcheck")).toBe("/factcheck");
    expect(normalizeDeepLinkPath("/dossier/abc?mode=mobile")).toBe("/dossier/abc?mode=mobile");
    expect(normalizeDeepLinkPath("https://edebatte.org/companion/x?y=1")).toBe("/companion/x?y=1");
    expect(normalizeDeepLinkPath("")).toBe("/");
  });

  it("builds absolute links only when origin is valid", () => {
    expect(buildDeepLinkUrl("https://edebatte.org", "/factcheck")).toBe("https://edebatte.org/factcheck");
    expect(buildDeepLinkUrl("https://edebatte.org", "dossier/42")).toBe("https://edebatte.org/dossier/42");
    expect(buildDeepLinkUrl("not-a-url", "/factcheck")).toBe("/factcheck");
    expect(buildDeepLinkUrl(null, "/create")).toBe("/create");
  });
});
