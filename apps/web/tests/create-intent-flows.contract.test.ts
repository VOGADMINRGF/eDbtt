import { describe, expect, it } from "vitest";
import {
  mapCreateIntentToProductMode,
  mapProductModeToCreateIntent,
  parseCreateIntent,
  resolveInitialCreateIntent,
} from "@/features/create/intentFlows";

describe("create intent flows contract", () => {
  it("parses canonical and localized intent params", () => {
    expect(parseCreateIntent("contribute")).toBe("contribute");
    expect(parseCreateIntent("check")).toBe("check");
    expect(parseCreateIntent("draft")).toBe("draft");
    expect(parseCreateIntent("beitragen")).toBe("contribute");
    expect(parseCreateIntent("prüfen")).toBe("check");
    expect(parseCreateIntent("entwerfen")).toBe("draft");
  });

  it("keeps product mode mapping stable in both directions", () => {
    expect(mapCreateIntentToProductMode("contribute")).toBe("analyze");
    expect(mapCreateIntentToProductMode("check")).toBe("media");
    expect(mapCreateIntentToProductMode("draft")).toBe("guided");

    expect(mapProductModeToCreateIntent("analyze")).toBe("contribute");
    expect(mapProductModeToCreateIntent("media")).toBe("check");
    expect(mapProductModeToCreateIntent("guided")).toBe("draft");
  });

  it("supports compatibility params without breaking deep links", () => {
    expect(
      resolveInitialCreateIntent({
        rawModeParam: "source",
      }),
    ).toBe("contribute");
    expect(
      resolveInitialCreateIntent({
        rawModeParam: "check",
      }),
    ).toBe("check");
    expect(
      resolveInitialCreateIntent({
        rawModeParam: "draft",
      }),
    ).toBe("draft");

    expect(
      resolveInitialCreateIntent({
        initialEntryIntent: "content_companion",
      }),
    ).toBe("check");

    expect(
      resolveInitialCreateIntent({
        initialEntryIntent: "round_setup",
      }),
    ).toBe("draft");
  });
});

