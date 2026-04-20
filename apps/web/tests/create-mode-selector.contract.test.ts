import { describe, expect, it } from "vitest";
import {
  CREATE_PRODUCT_MODES,
  resolveCreateProductModeConfig,
  resolveInitialCreateProductMode,
} from "@/app/create/CreateClient";

describe("create mode selector contract", () => {
  it("exposes exactly three visible product modes", () => {
    expect(CREATE_PRODUCT_MODES).toEqual(["analyze", "media", "guided"]);
  });

  it("maps media and guided entry hints to matching visible modes", () => {
    expect(
      resolveInitialCreateProductMode({
        initialEntryIntent: "content_companion",
      }),
    ).toBe("media");

    expect(
      resolveInitialCreateProductMode({
        initialEntryIntent: "round_setup",
      }),
    ).toBe("guided");

    expect(
      resolveInitialCreateProductMode({
        initialEntryMode: "guided",
      }),
    ).toBe("guided");
  });

  it("keeps analyze as the canonical default", () => {
    expect(resolveInitialCreateProductMode({})).toBe("analyze");
  });

  it("defines stable CTA copy for each mode", () => {
    expect(resolveCreateProductModeConfig("analyze").ctaLabel).toBe("Beitrag einbringen");
    expect(resolveCreateProductModeConfig("media").ctaLabel).toBe("Prüfung starten");
    expect(resolveCreateProductModeConfig("guided").ctaLabel).toBe("Gemeinsam ausarbeiten");
  });
});
