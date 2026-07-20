import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("smtp-config-guard.contract", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.clearAllMocks();
    process.env.STATUS_REPORT_ENABLED = "true";
    process.env.STATUS_REPORT_RECIPIENTS = "rgf@voiceopengov.de";
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
    mocks.sendMail.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    setStatusReportRepoForTests(null);
    vi.unstubAllEnvs();
  });

  it("fails with smtp_config_missing and does not send mail without SMTP config", async () => {
    const result = await runManualStatusReportNow();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("smtp_config_missing");
    expect(result.run?.status).toBe("failed");
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});
