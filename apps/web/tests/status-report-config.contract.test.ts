import { describe, expect, it } from "vitest";
import { readStatusReportConfig } from "@/features/ops/statusReport/config";

describe("status-report-config.contract", () => {
  it("filters recipients defensively to rgf@voiceopengov.de", () => {
    const config = readStatusReportConfig({
      STATUS_REPORT_ENABLED: "true",
      STATUS_REPORT_RECIPIENTS: "ops@example.org, RGF@voiceopengov.de,rgf@voiceopengov.de",
    });

    expect(config.recipients).toEqual(["rgf@voiceopengov.de"]);
  });

  it("supports optional STATUS_REPORT_SLOTS csv with fallback", () => {
    const custom = readStatusReportConfig({
      STATUS_REPORT_ENABLED: "true",
      STATUS_REPORT_RECIPIENTS: "rgf@voiceopengov.de",
      STATUS_REPORT_SLOTS: "17:00,05:00,invalid,27:00",
    });
    expect(custom.scheduleSlots).toEqual(["17:00", "05:00"]);

    const fallback = readStatusReportConfig({
      STATUS_REPORT_ENABLED: "true",
      STATUS_REPORT_RECIPIENTS: "rgf@voiceopengov.de",
      STATUS_REPORT_SLOTS: "invalid",
    });
    expect(fallback.scheduleSlots).toEqual(["05:00", "17:00"]);
  });
});
