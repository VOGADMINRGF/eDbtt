import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web manifest contract", () => {
  it("exposes installability baseline for mobile web app usage", () => {
    const data = manifest();
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/start");
    expect(data.scope).toBe("/");
    expect(data.theme_color).toBe("#06b6d4");
    expect(Array.isArray(data.icons)).toBe(true);
    expect((data.icons ?? []).length).toBeGreaterThan(0);
  });
});
