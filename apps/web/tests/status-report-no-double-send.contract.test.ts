import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
  collectStatusReportSummary: vi.fn(),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

vi.mock("@/features/ops/statusReport/collect", () => ({
  collectStatusReportSummary: (...args: unknown[]) => mocks.collectStatusReportSummary(...args),
}));

import { createInMemoryStatusReportRepo, setStatusReportRepoForTests } from "@/features/ops/statusReport/repo";
import { runScheduledStatusReportSlot } from "@/features/ops/statusReport/run";

describe("status-report-no-double-send.contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STATUS_REPORT_ENABLED = "true";
    process.env.STATUS_REPORT_RECIPIENTS = "ops@example.org";
    process.env.STATUS_REPORT_TZ = "Europe/Berlin";
    process.env.SMTP_HOST = "smtp.example.org";

    setStatusReportRepoForTests(createInMemoryStatusReportRepo());

    mocks.collectStatusReportSummary.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      timezone: "Europe/Berlin",
      slot: "05:00",
      overallStatus: "green",
      summaryPoints: ["alles ok"],
      totals: { green: 1, yellow: 0, red: 0, grey: 0 },
      sections: [],
    });
    mocks.sendMail.mockResolvedValue({ ok: true, smtp: true });
  });

  it("sends only once for the same scheduled slot key", async () => {
    const now = new Date("2026-04-19T03:02:00.000Z");

    const first = await runScheduledStatusReportSlot({ slot: "05:00", now });
    const second = await runScheduledStatusReportSlot({ slot: "05:00", now });

    expect(first.ok).toBe(true);
    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe("status_report_slot_already_processed");
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });
});
