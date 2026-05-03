import { describe, expect, it } from "vitest";
import { resolveThemenradarMembershipEntry } from "@features/themenradar/membershipCta";

describe("themenradar-membership-entry.contract", () => {
  it("returns separated participation/membership/order CTAs without tracking payload", () => {
    const entry = resolveThemenradarMembershipEntry({
      id: "thema_77",
      title: "Begruenung im Quartier",
      membershipPotentialScore: 73,
    });

    expect(entry.membershipSignalLevel).toBe("high");
    expect(entry.noTrackingFields).toBe(true);

    const hrefs = entry.callsToAction.map((cta) => cta.href);
    expect(hrefs).toEqual([
      "/create?entryIntent=issue_signal&entryMode=guided",
      "/pricing",
      "/order",
    ]);

    const flattened = JSON.stringify(entry).toLowerCase();
    expect(flattened).not.toContain("/vormerken");
    expect(flattened).not.toContain("session");
    expect(flattened).not.toContain("pixel");
    expect(flattened).not.toContain("fingerprint");
  });

  it("maps medium and low membership potentials deterministically", () => {
    const medium = resolveThemenradarMembershipEntry({
      id: "thema_20",
      title: "Schulwege",
      membershipPotentialScore: 55,
    });
    const low = resolveThemenradarMembershipEntry({
      id: "thema_03",
      title: "Parkpflege",
      membershipPotentialScore: 12,
    });

    expect(medium.membershipSignalLevel).toBe("medium");
    expect(low.membershipSignalLevel).toBe("low");
  });
});
