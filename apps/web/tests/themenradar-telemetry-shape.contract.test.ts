import { describe, expect, it } from "vitest";
import {
  applyThemenradarTelemetryEvent,
  createEmptyThemenradarTelemetry,
} from "@features/themenradar/telemetry";

describe("themenradar telemetry shape", () => {
  it("keeps aggregated click/lead/membership counters with stable shape", () => {
    let snapshot = createEmptyThemenradarTelemetry("kampagne-a");
    snapshot = applyThemenradarTelemetryEvent({
      snapshot,
      event: { type: "click", amount: 3 },
    });
    snapshot = applyThemenradarTelemetryEvent({
      snapshot,
      event: { type: "lead" },
    });
    snapshot = applyThemenradarTelemetryEvent({
      snapshot,
      event: { type: "membership", amount: 2 },
    });

    expect(snapshot).toMatchObject({
      campaignKey: "kampagne-a",
      clicks: 3,
      leads: 1,
      memberships: 2,
    });
    expect(typeof snapshot.updatedAt).toBe("string");
    expect(new Date(snapshot.updatedAt).toString()).not.toBe("Invalid Date");
  });

  it("normalizes invalid amounts to a safe minimum increment", () => {
    const snapshot = applyThemenradarTelemetryEvent({
      snapshot: null,
      event: { type: "click", amount: -50 },
    });
    expect(snapshot.clicks).toBe(1);
    expect(snapshot.leads).toBe(0);
    expect(snapshot.memberships).toBe(0);
  });
});

