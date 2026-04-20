import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getThemenradarTelemetryReportShape: vi.fn(),
  listThemenradarItems: vi.fn(),
}));

vi.mock("@features/themenradar/store", () => ({
  getThemenradarTelemetryReportShape: (...args: unknown[]) =>
    mocks.getThemenradarTelemetryReportShape(...args),
  listThemenradarItems: (...args: unknown[]) => mocks.listThemenradarItems(...args),
}));

import { collectStatusReportSummary } from "@/features/ops/statusReport/collect";
import type { StatusReportConfig } from "@/features/ops/statusReport/config";

describe("status-report-shape.contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listThemenradarItems.mockResolvedValue([]);
    mocks.getThemenradarTelemetryReportShape.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      totalItems: 0,
      totals: { clicks: 0, leads: 0, memberships: 0 },
      byStatus: [],
      byCampaign: [],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = String(init?.method ?? "GET").toUpperCase();

        if (method === "GET" && url.includes("/api/health/system")) {
          return new Response(JSON.stringify({ ok: true, systems: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        if (method === "POST" && url.includes("/api/contributions/analyze")) {
          const payload = JSON.parse(String(init?.body ?? "{}"));
          if (payload?.test === "ping") {
            return new Response(JSON.stringify({ ok: true, result: { ping: "pong" } }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          return new Response(
            JSON.stringify({ ok: true, result: { claims: [], questions: [], knots: [] } }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          );
        }

        if (method === "POST" && url.includes("/api/create/analyze")) {
          return new Response(JSON.stringify({ ok: true, result: { ping: "pong" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response("ok", { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a compact report summary with expected sections and totals", async () => {
    const config: StatusReportConfig = {
      enabled: true,
      recipients: ["ops@example.org"],
      timezone: "Europe/Berlin",
      subjectPrefix: "[ops]",
      includeAiSmokes: true,
      baseUrl: "http://localhost:3000",
      slotGraceMinutes: 20,
      scheduleSlots: ["05:00", "17:00"],
    };

    const report = await collectStatusReportSummary({ config, slot: "05:00" });

    expect(report.slot).toBe("05:00");
    expect(report.sections).toHaveLength(4);
    expect(report.totals.green).toBeGreaterThan(0);
    expect(report.summaryPoints.length).toBeGreaterThan(0);
  });
});
