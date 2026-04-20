import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  getThemenradarTelemetryReportShape: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/themenradar/store", () => ({
  getThemenradarTelemetryReportShape: (...args: unknown[]) =>
    mocks.getThemenradarTelemetryReportShape(...args),
}));

import { GET as REPORT_GET } from "@/app/api/admin/themenradar/report/route";

describe("/api/admin/themenradar/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    mocks.getThemenradarTelemetryReportShape.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      totalItems: 0,
      totals: { clicks: 0, leads: 0, memberships: 0 },
      byStatus: [],
      byCampaign: [],
    });
  });

  it("returns report with filter query", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/themenradar/report?status=review_ready&sourceType=community&limit=25",
    );
    const res = await REPORT_GET(req);
    expect(res.status).toBe(200);
    expect(mocks.getThemenradarTelemetryReportShape).toHaveBeenCalledWith({
      status: "review_ready",
      sourceType: "community",
      limit: 25,
    });
  });

  it("passes through auth gate failures", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const req = new NextRequest("http://localhost/api/admin/themenradar/report");
    const res = await REPORT_GET(req);
    expect(res.status).toBe(403);
  });
});
