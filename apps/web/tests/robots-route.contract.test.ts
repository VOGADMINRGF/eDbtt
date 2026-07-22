import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots metadata route contract", () => {
  it("exposes the production robots baseline without inventing a sitemap", () => {
    const data = robots();
    const rules = Array.isArray(data.rules) ? data.rules : [data.rules];

    expect(rules).toEqual([
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
      }),
    ]);
    expect(data.host).toBe("https://www.edebatte.org");
    expect(data.sitemap).toBeUndefined();
  });
});
