import { describe, expect, it } from "vitest";
import { parseFromDraftParam } from "@/features/swipes/fromDraftParam";

describe("swipes page params", () => {
  it("accepts valid draft ids from fromDraft", () => {
    expect(parseFromDraftParam("65f000000000000000000011")).toBe("65f000000000000000000011");
    expect(parseFromDraftParam(["65F000000000000000000011"])).toBe("65f000000000000000000011");
  });

  it("rejects invalid fromDraft values", () => {
    expect(parseFromDraftParam(undefined)).toBeNull();
    expect(parseFromDraftParam("")).toBeNull();
    expect(parseFromDraftParam("../../etc/passwd")).toBeNull();
    expect(parseFromDraftParam("https://evil.example")).toBeNull();
    expect(parseFromDraftParam("not-an-object-id")).toBeNull();
  });
});
