import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("pwa manifest contract", () => {
  it("keeps the citizen-facing mobile install baseline on existing routes", () => {
    const data = manifest();

    expect(data.name).toBeTruthy();
    expect(data.short_name).toBe("eDebatte");
    expect(data.start_url).toBe("/start");
    expect(data.display).toBe("standalone");
    expect(data.theme_color).toBe("#06b6d4");
    expect(data.background_color).toBe("#f8fafc");

    expect(data.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        }),
        expect.objectContaining({
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        }),
        expect.objectContaining({
          src: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        }),
      ]),
    );
  });
});
