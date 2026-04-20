import { describe, expect, it } from "vitest";
import { getCreateSurfaceModeDefinitions } from "@/features/create/createSurfaceConfig";

describe("create mode i18n contract", () => {
  it("uses product-approved DE labels", () => {
    const modes = getCreateSurfaceModeDefinitions("de");
    expect(modes.analyze.label).toBe("Beitragen");
    expect(modes.media.label).toBe("Prüfen");
    expect(modes.guided.label).toBe("Entwerfen");
  });

  it("uses product-approved EN labels", () => {
    const modes = getCreateSurfaceModeDefinitions("en");
    expect(modes.analyze.label).toBe("Contribute");
    expect(modes.media.label).toBe("Review");
    expect(modes.guided.label).toBe("Draft together");
  });
});
