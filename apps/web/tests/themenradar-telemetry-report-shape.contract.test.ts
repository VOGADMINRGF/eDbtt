import { beforeEach, describe, expect, it } from "vitest";
import {
  applyThemenradarTelemetry,
  createContentPrepForThemenradarItem,
  createShareReadyForThemenradarItem,
  createThemenradarItem,
  getThemenradarTelemetryReportShape,
  setThemenradarRepoForTests,
} from "@features/themenradar/store";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";

describe("themenradar-telemetry-report-shape.contract", () => {
  beforeEach(() => {
    setThemenradarRepoForTests(createInMemoryThemenradarRepo());
  });

  it("aggregates telemetry by totals/status/campaign for admin report followups", async () => {
    const actor = { userId: "admin-1" };

    const raw = await createThemenradarItem({
      title: "ÖPNV-Taktung",
      rawSignal: "Signale aus Pendlergruppen",
      sourceType: "community",
      campaignKey: "oepnv",
    }, actor);

    const prepared = await createThemenradarItem({
      title: "Schulgesundheit",
      rawSignal: "Signale aus Elternrat",
      sourceType: "create_intake",
      campaignKey: "schule",
    }, actor);

    await createContentPrepForThemenradarItem(prepared.id, actor);
    await createShareReadyForThemenradarItem(prepared.id, actor);

    await applyThemenradarTelemetry(raw.id, { type: "click", amount: 2 }, actor);
    await applyThemenradarTelemetry(prepared.id, { type: "click", amount: 5 }, actor);
    await applyThemenradarTelemetry(prepared.id, { type: "lead", amount: 2 }, actor);
    await applyThemenradarTelemetry(prepared.id, { type: "membership", amount: 1 }, actor);

    const report = await getThemenradarTelemetryReportShape({ status: "all", sourceType: "all" });

    expect(report.totalItems).toBe(2);
    expect(report.totals).toMatchObject({
      clicks: 7,
      leads: 2,
      memberships: 1,
    });
    expect(report.byStatus.some((entry) => entry.status === "raw" && entry.items >= 1)).toBe(true);
    expect(report.byStatus.some((entry) => entry.status === "review_ready" && entry.items >= 1)).toBe(true);
    expect(report.byCampaign.some((entry) => entry.campaignKey === "oepnv" && entry.clicks === 2)).toBe(true);
    expect(report.byCampaign.some((entry) => entry.campaignKey === "schule" && entry.memberships === 1)).toBe(true);
  });
});
