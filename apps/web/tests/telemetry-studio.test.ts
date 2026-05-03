import { describe, expect, it } from "vitest";
import {
  clearStudioTelemetryEvents,
  listStudioTelemetryEvents,
  recordStudioTelemetryEvent,
} from "@features/outputEngine";

describe("studio telemetry adapter", () => {
  it("records internal studio events without external trackers", () => {
    clearStudioTelemetryEvents();

    recordStudioTelemetryEvent({
      name: "master_post_generated",
      dossierId: "dossier-1",
    });
    recordStudioTelemetryEvent({
      name: "draft_saved",
      dossierId: "dossier-1",
      channel: "website_embed",
    });
    recordStudioTelemetryEvent({
      name: "plan_adopted",
      dossierId: "dossier-1",
    });

    const events = listStudioTelemetryEvents();
    expect(events).toHaveLength(3);
    expect(events.map((entry) => entry.name)).toEqual([
      "master_post_generated",
      "draft_saved",
      "plan_adopted",
    ]);
    expect(events.every((entry) => typeof entry.at === "string")).toBe(true);
  });
});
