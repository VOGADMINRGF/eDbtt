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

  it("accepts explicit intent params and legacy mode aliases for deep-link compatibility", () => {
    expect(
      resolveInitialCreateProductMode({
        initialIntentParam: "check",
      }),
    ).toBe("media");
    expect(
      resolveInitialCreateProductMode({
        initialIntentParam: "draft",
      }),
    ).toBe("guided");
    expect(
      resolveInitialCreateProductMode({
        initialModeParam: "source",
      }),
    ).toBe("analyze");
    expect(
      resolveInitialCreateProductMode({
        initialModeParam: "check",
      }),
    ).toBe("media");
    expect(
      resolveInitialCreateProductMode({
        initialModeParam: "draft",
      }),
    ).toBe("guided");
  });

  it("defines stable CTA copy for each mode", () => {
    expect(resolveCreateProductModeConfig("analyze").ctaLabel).toBe("Beitrag einreichen");
    expect(resolveCreateProductModeConfig("media").ctaLabel).toBe("Dialog starten");
    expect(resolveCreateProductModeConfig("guided").ctaLabel).toBe("Dialog starten");
  });
});
