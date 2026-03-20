import { describe, expect, it } from "vitest";
import { createModeFromIntent, parseCreateMode } from "@/features/create/intents";

describe("create mode canonical parsing", () => {
  it("keeps canonical modes", () => {
    expect(parseCreateMode("manual")).toBe("manual");
    expect(parseCreateMode("source")).toBe("source");
    expect(parseCreateMode("ai")).toBe("ai");
  });

  it("maps legacy aliases to canonical modes", () => {
    expect(parseCreateMode("ai_assist")).toBe("ai");
    expect(parseCreateMode("feed")).toBe("source");
    expect(parseCreateMode("cluster")).toBe("source");
  });

  it("keeps intent fallback stable", () => {
    expect(createModeFromIntent("claim")).toBe("manual");
    expect(createModeFromIntent("source")).toBe("source");
    expect(createModeFromIntent(undefined)).toBe("source");
  });
});
