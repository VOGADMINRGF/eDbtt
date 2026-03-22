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
    expect(formatVoteDraftStatusLabel("draft", "de")).toBe("Entwurf");
    expect(formatFeedReviewStateLabel("all", "de")).toBe("Alle Warteschlangen-Zustände");
    expect(formatFeedReviewStateLabel("all", "en")).toBe("All queue states");
    expect(formatFeedReviewStateLabel("queued", "de")).toBe("In Warteschlange");
    expect(formatFeedReviewStateLabel("attached", "en")).toBe("Linked");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "de")).toBe("Manuell via /create");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "en")).toBe("Manual via /create");
    expect(formatDecisionPathLabel("attach_to_existing_anlassraum", "en")).toBe("Link to Anlassraum");
    expect(formatDecisionPathLabel("create_anlassraum_candidate", "en")).toBe("Create an Anlassraum candidate");
  });

  it("exposes localized output action and shared text bundles", () => {
    expect(formatOutputActionLabel("publish", "de")).toBe("Manuell publizieren");
    expect(formatOutputActionLabel("publish", "en")).toBe("Manual publish");
    expect(formatOutputActionLabel("queue", "de")).toBe("In Warteschlange setzen");
    expect(formatOutputActionLabel("send_to_review", "de")).toBe("Zur Prüfung senden");
    expect(formatOutputSeedStatusLabel("ready", "de")).toBe("Bereit");
    expect(formatOutputSeedStatusLabel("ready", "en")).toBe("Ready");
    expect(formatOutputSeedReviewStateLabel("approved", "de")).toBe("Freigegeben");
    expect(formatOutputSeedReviewStateLabel("approved", "en")).toBe("Approved");
    expect(formatOutputSeedReviewStateLabel("queued", "de")).toBe("In Warteschlange");
    expect(getOperatorSystemTexts("de").feeds.headerTitle).toBe("Feed-Leitstand");
    expect(getOperatorSystemTexts("en").feeds.headerTitle).toBe("Feed control plane");
  });
});
