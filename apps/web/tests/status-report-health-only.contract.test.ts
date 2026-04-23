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
import { runManualStatusReportNow } from "@/features/ops/statusReport/run";

describe("status-report-health-only.contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STATUS_REPORT_ENABLED = "true";
    process.env.STATUS_REPORT_RECIPIENTS = "";
    process.env.STATUS_REPORT_TZ = "Europe/Berlin";
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_URL;

    setStatusReportRepoForTests(createInMemoryStatusReportRepo());

    mocks.collectStatusReportSummary.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      timezone: "Europe/Berlin",
      slot: "manual",
      overallStatus: "green",
      summaryPoints: ["alles ok"],
      totals: { green: 1, yellow: 0, red: 0, grey: 0 },
      sections: [],
    });
    mocks.sendMail.mockResolvedValue({ ok: true, smtp: true });
  });

  it("allows health_only manual runs without recipients and without mail delivery", async () => {
    const result = await runManualStatusReportNow({ runType: "health_only" });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("status_report_health_only_completed");
    expect(result.run?.status).toBe("skipped");
    expect(result.run?.mailSent).toBe(false);
    expect(result.run?.report).not.toBeNull();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("keeps recipients mandatory for full manual runs", async () => {
    const result = await runManualStatusReportNow({ runType: "full" });

    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("status_report_no_recipients");
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});
