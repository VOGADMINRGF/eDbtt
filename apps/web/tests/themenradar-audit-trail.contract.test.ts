import { beforeEach, describe, expect, it } from "vitest";
import {
  createContentPrepForThemenradarItem,
  createShareReadyForThemenradarItem,
  createThemenradarItem,
  getThemenradarDetail,
  setThemenradarRepoForTests,
  updateThemenradarItem,
} from "@features/themenradar/store";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";

describe("themenradar-audit-trail.contract", () => {
  beforeEach(() => {
    setThemenradarRepoForTests(createInMemoryThemenradarRepo());
  });

  it("writes append-only audit events across lifecycle and review actions", async () => {
    const actor = { userId: "admin-42", email: "ops@example.org" };
    const item = await createThemenradarItem(
      {
        title: "Kommunaler Hitzeschutz",
        rawSignal: "Mehrere Quellen melden steigende Belastung in Schulen.",
        sourceType: "community",
      },
      actor,
    );

    await createContentPrepForThemenradarItem(item.id, actor);
    await createShareReadyForThemenradarItem(item.id, actor);
    await updateThemenradarItem(
      item.id,
      {
        lifecycleStatus: "published",
        publishIntent: true,
        reviewNote: "Freigabe nach redaktioneller Prüfung.",
      },
      actor,
    );

    const detail = await getThemenradarDetail(item.id);
    expect(detail).toBeTruthy();

    const eventTypes = detail!.auditTrail.map((entry) => entry.eventType);
    expect(eventTypes).toContain("created");
    expect(eventTypes).toContain("qualified");
    expect(eventTypes).toContain("content_prep_generated");
    expect(eventTypes).toContain("review_ready_set");
    expect(eventTypes).toContain("share_ready_generated");
    expect(eventTypes).toContain("published_set");

    const versions = detail!.auditTrail.map((entry) => entry.auditVersion);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(detail!.item.auditVersion).toBe(versions[versions.length - 1]);
    expect(detail!.item.lastReviewedBy).toBe("admin-42");
  });
});
