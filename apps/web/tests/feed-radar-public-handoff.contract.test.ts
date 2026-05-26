import { describe, expect, it } from "vitest";
import { buildFeedRadarPublicHandoffs } from "@features/feeds/publicHandoff";

describe("feed radar public handoff contract", () => {
  it("keeps public follow-up surfaces on existing routes only", () => {
    const handoffs = buildFeedRadarPublicHandoffs({
      hasSwipeStatements: true,
      hasAnlassraumUpdates: true,
      hasDossierLinks: true,
    });

    expect(handoffs).toEqual([
      expect.objectContaining({
        surface: "swipes",
        href: "/swipes",
        label: "Zu Swipes",
      }),
      expect.objectContaining({
        surface: "runden",
        href: "/runden",
        label: "Zum Anlassraum",
      }),
      expect.objectContaining({
        surface: "dossier",
        href: "/dossier",
        label: "Zum Dossier",
      }),
    ]);
  });

  it("does not invent fake public routes when no reviewed follow-up exists", () => {
    expect(
      buildFeedRadarPublicHandoffs({
        hasSwipeStatements: false,
        hasAnlassraumUpdates: false,
        hasDossierLinks: false,
      }),
    ).toEqual([]);
  });
});
