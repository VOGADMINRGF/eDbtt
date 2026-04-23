import { describe, expect, it } from "vitest";
import { buildStatusReportSubject, renderStatusReportMail } from "@/features/ops/statusReport/mail";
import type { StatusReportSummary } from "@/features/ops/statusReport/contracts";

describe("status-report-mail-render.contract", () => {
  it("renders plain text and html report with section details", () => {
    const summary: StatusReportSummary = {
      generatedAt: "2026-04-19T05:00:00.000Z",
      timezone: "Europe/Berlin",
      slot: "05:00",
      overallStatus: "yellow",
      summaryPoints: ["Checks: 6 grün, 1 gelb, 0 rot, 0 grau.", "AI standard läuft im fallback-Modus."],
      totals: { green: 6, yellow: 1, red: 0, grey: 0 },
      sections: [
        {
          key: "platform",
          label: "Plattform-Kernstatus",
          checks: [
            {
              key: "platform_health",
              label: "Systemmatrix",
              status: "green",
              detail: "OK",
            },
          ],
        },
        {
          key: "ai",
          label: "AI-Routen-Smokechecks",
          checks: [
            {
              key: "ai_full",
              label: "/api/contributions/analyze",
              status: "yellow",
              detail: "Fallback aktiv",
            },
          ],
        },
        {
          key: "themenradar",
          label: "Themenradar / Admin",
          checks: [],
        },
        {
          key: "order_pricing",
          label: "Order / Pricing",
          checks: [],
        },
      ],
    };

    const rendered = renderStatusReportMail(summary);
    const subject = buildStatusReportSubject({ summary, subjectPrefix: "[ops]" });

    expect(subject).toContain("[ops]");
    expect(subject).toContain("GELB");
    expect(rendered.text).toContain("AI-Routen-Smokechecks");
    expect(rendered.html).toContain("Ops Statusbericht");
    expect(rendered.html).toContain("Executive Summary");
  });
});
