import { describe, expect, it } from "vitest";
import {
  getSocialDistributionStatusMeta,
  SOCIAL_DISTRIBUTION_V1_STATUSES,
  socialDistributionStatusLabel,
} from "@features/outputEngine";

describe("social distribution status contract", () => {
  it("keeps the v1 queue statuses complete and user-facing in simple German", () => {
    expect(SOCIAL_DISTRIBUTION_V1_STATUSES).toEqual([
      "draft_created",
      "asset_generated",
      "needs_review",
      "review_requested",
      "approved",
      "queued",
      "scheduled_ready",
      "exported",
      "copied",
      "blocked",
      "archived",
      "error",
    ]);

    expect(socialDistributionStatusLabel("draft_created")).toBe("Entwurf erstellt");
    expect(socialDistributionStatusLabel("asset_generated")).toBe("CI-Ausgabe vorbereitet");
    expect(socialDistributionStatusLabel("review_requested")).toBe("Prüfung angefordert");
    expect(socialDistributionStatusLabel("scheduled_ready")).toBe("Bereit zur Planung");
    expect(socialDistributionStatusLabel("exported")).toBe("Exportiert");
    expect(socialDistributionStatusLabel("blocked")).toBe("Blockiert");
  });

  it("keeps every status free of auto-publish claims", () => {
    for (const status of SOCIAL_DISTRIBUTION_V1_STATUSES) {
      const meta = getSocialDistributionStatusMeta(status);
      expect(meta.label.toLowerCase()).not.toContain("veröffentlicht");
      expect(meta.description.toLowerCase()).not.toContain("oauth");
    }
  });
});
