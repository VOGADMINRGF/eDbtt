import { describe, expect, it } from "vitest";
import {
  formatDecisionPathLabel,
  formatFeedReviewStateLabel,
  formatOutputActionLabel,
  formatOutputSeedReviewStateLabel,
  formatOutputSeedStatusLabel,
  formatVoteDraftStatusLabel,
  getOperatorSystemTexts,
  resolveOperatorLocale,
} from "@/features/i18n/operatorSystemTexts";

describe("operator system texts i18n", () => {
  it("resolves unsupported locales to de", () => {
    expect(resolveOperatorLocale("fr")).toBe("de");
    expect(resolveOperatorLocale(undefined)).toBe("de");
    expect(resolveOperatorLocale("en")).toBe("en");
  });

  it("returns localized feed draft and decision labels", () => {
    expect(formatVoteDraftStatusLabel("published", "de")).toBe("Veröffentlicht");
    expect(formatVoteDraftStatusLabel("published", "en")).toBe("Published");
    expect(formatFeedReviewStateLabel("all", "de")).toBe("Alle Queue-States");
    expect(formatFeedReviewStateLabel("all", "en")).toBe("All queue states");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "de")).toBe("Manuell via /create");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "en")).toBe("Manual via /create");
  });

  it("exposes localized output action and shared text bundles", () => {
    expect(formatOutputActionLabel("publish", "de")).toBe("Manuell publizieren");
    expect(formatOutputActionLabel("publish", "en")).toBe("Manual publish");
    expect(formatOutputSeedStatusLabel("ready", "de")).toBe("Bereit");
    expect(formatOutputSeedStatusLabel("ready", "en")).toBe("Ready");
    expect(formatOutputSeedReviewStateLabel("approved", "de")).toBe("Freigegeben");
    expect(formatOutputSeedReviewStateLabel("approved", "en")).toBe("Approved");
    expect(getOperatorSystemTexts("de").feeds.headerTitle).toBe("Feed Control Plane");
    expect(getOperatorSystemTexts("en").feeds.headerTitle).toBe("Feed control plane");
  });
});
