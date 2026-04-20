import { describe, expect, it } from "vitest";
import {
  getCreateComposerTexts,
  getCreateContextAnchorDefinitions,
  getCreateHelperLinks,
  getCreateSurfaceModeDefinitions,
  getCreateSurfaceTexts,
} from "@/features/create/createSurfaceConfig";

describe("create i18n contract", () => {
  it("keeps DE/EN mode, anchor and helper structures aligned", () => {
    const deModes = getCreateSurfaceModeDefinitions("de");
    const enModes = getCreateSurfaceModeDefinitions("en");

    expect(Object.keys(deModes)).toEqual(Object.keys(enModes));
    expect(getCreateContextAnchorDefinitions("de").map((anchor) => anchor.id)).toEqual(
      getCreateContextAnchorDefinitions("en").map((anchor) => anchor.id),
    );
    expect(getCreateHelperLinks("de").map((link) => link.href)).toEqual(
      getCreateHelperLinks("en").map((link) => link.href),
    );
  });

  it("provides non-empty composer + surface texts in both locales", () => {
    const locales = ["de", "en"] as const;
    for (const locale of locales) {
      const composer = getCreateComposerTexts(locale);
      const surface = getCreateSurfaceTexts(locale);

      expect(composer.headline.line1Accent.trim().length).toBeGreaterThan(0);
      expect(composer.contextEntryTitle.trim().length).toBeGreaterThan(0);
      expect(surface.sublineCanonical.trim().length).toBeGreaterThan(0);
      expect(surface.guidedTitle.trim().length).toBeGreaterThan(0);
    }
  });
});
