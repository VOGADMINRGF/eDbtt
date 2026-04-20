import { beforeEach, describe, expect, it } from "vitest";
import {
  createThemenradarItem,
  getThemenradarDetail,
  setThemenradarRepoForTests,
} from "@features/themenradar/store";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";

describe("themenradar-persistence.contract", () => {
  beforeEach(() => {
    setThemenradarRepoForTests(createInMemoryThemenradarRepo());
  });

  it("keeps records available when the backing repo instance is recreated from persisted snapshots", async () => {
    const repoA = createInMemoryThemenradarRepo();
    setThemenradarRepoForTests(repoA);

    const created = await createThemenradarItem(
      {
        title: "Hitzeaktionsplan Innenstadt",
        rawSignal: "Signale aus Verwaltung, Schule und Pflege.",
        sourceType: "manual",
      },
      { userId: "admin-1" },
    );

    const snapshotRecords = await repoA.listRecords({ status: "all", sourceType: "all", limit: 100 });
    const snapshotAudit = await repoA.listAuditEvents(created.id);

    const repoB = createInMemoryThemenradarRepo({
      records: snapshotRecords,
      auditEvents: snapshotAudit,
    });
    setThemenradarRepoForTests(repoB);

    const detail = await getThemenradarDetail(created.id);
    expect(detail).toBeTruthy();
    expect(detail?.item.title).toBe("Hitzeaktionsplan Innenstadt");
    expect(detail?.auditTrail.some((event) => event.eventType === "created")).toBe(true);
  });
});
