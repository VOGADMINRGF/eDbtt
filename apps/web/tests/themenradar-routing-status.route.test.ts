import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  listThemenradarItems: vi.fn(),
  createThemenradarItem: vi.fn(),
  importIssueSignalFromCreate: vi.fn(),
  getThemenradarDetail: vi.fn(),
  updateThemenradarItem: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/themenradar/store", () => ({
  listThemenradarItems: (...args: unknown[]) => mocks.listThemenradarItems(...args),
  createThemenradarItem: (...args: unknown[]) => mocks.createThemenradarItem(...args),
  importIssueSignalFromCreate: (...args: unknown[]) =>
    mocks.importIssueSignalFromCreate(...args),
  getThemenradarDetail: (...args: unknown[]) => mocks.getThemenradarDetail(...args),
  updateThemenradarItem: (...args: unknown[]) => mocks.updateThemenradarItem(...args),
}));

import {
  GET as LIST_GET,
  POST as LIST_POST,
} from "@/app/api/admin/themenradar/route";
import {
  GET as DETAIL_GET,
  PATCH as DETAIL_PATCH,
} from "@/app/api/admin/themenradar/[id]/route";

describe("/api/admin/themenradar routing + status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    mocks.listThemenradarItems.mockReturnValue([]);
    mocks.createThemenradarItem.mockReturnValue({
      id: "themenradar_1",
      lifecycleStatus: "raw",
    });
    mocks.importIssueSignalFromCreate.mockReturnValue({
      id: "themenradar_2",
      lifecycleStatus: "raw",
      sourceType: "create_intake",
    });
    mocks.getThemenradarDetail.mockReturnValue({
      item: { id: "themenradar_1", lifecycleStatus: "raw" },
      contentPrep: null,
      lifecycleHistory: [],
    });
    mocks.updateThemenradarItem.mockReturnValue({
      id: "themenradar_1",
      lifecycleStatus: "review_ready",
    });
  });

  it("lists items with status/source filters", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/themenradar?status=raw&sourceType=community&limit=10",
    );
    const res = await LIST_GET(req);
    expect(res.status).toBe(200);
    expect(mocks.listThemenradarItems).toHaveBeenCalledWith({
      status: "raw",
      sourceType: "community",
      q: null,
      limit: 10,
    });
  });

  it("passes the search query through to Themenradar list loading", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/themenradar?status=review_ready&sourceType=create_intake&q=verkehr&limit=12",
    );
    const res = await LIST_GET(req);
    expect(res.status).toBe(200);
    expect(mocks.listThemenradarItems).toHaveBeenCalledWith({
      status: "review_ready",
      sourceType: "create_intake",
      q: "verkehr",
      limit: 12,
    });
  });

  it("creates create_intake items via issue_signal import path", async () => {
    const req = new NextRequest("http://localhost/api/admin/themenradar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Signal aus /create",
        rawSignal: "issue_signal text",
        sourceType: "create_intake",
      }),
    });
    const res = await LIST_POST(req);
    expect(res.status).toBe(200);
    expect(mocks.importIssueSignalFromCreate).toHaveBeenCalled();
    expect(mocks.createThemenradarItem).not.toHaveBeenCalled();
    expect(mocks.importIssueSignalFromCreate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ userId: "admin-1" }),
    );
  });

  it("returns detail and allows lifecycle patch transition", async () => {
    const getReq = new NextRequest("http://localhost/api/admin/themenradar/themenradar_1");
    const getRes = await DETAIL_GET(getReq, {
      params: Promise.resolve({ id: "themenradar_1" }),
    });
    expect(getRes.status).toBe(200);

    const patchReq = new NextRequest("http://localhost/api/admin/themenradar/themenradar_1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lifecycleStatus: "review_ready",
      }),
    });
    const patchRes = await DETAIL_PATCH(patchReq, {
      params: Promise.resolve({ id: "themenradar_1" }),
    });
    expect(patchRes.status).toBe(200);
    expect(mocks.updateThemenradarItem).toHaveBeenCalledWith(
      "themenradar_1",
      expect.objectContaining({
        lifecycleStatus: "review_ready",
      }),
      expect.objectContaining({ userId: "admin-1" }),
    );
  });

  it("maps invalid lifecycle transitions to 409", async () => {
    mocks.updateThemenradarItem.mockImplementation(() => {
      throw new Error("invalid_lifecycle_transition");
    });
    const patchReq = new NextRequest("http://localhost/api/admin/themenradar/themenradar_1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lifecycleStatus: "review_ready",
      }),
    });
    const patchRes = await DETAIL_PATCH(patchReq, {
      params: Promise.resolve({ id: "themenradar_1" }),
    });
    expect(patchRes.status).toBe(409);
    await expect(patchRes.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_lifecycle_transition",
    });
  });

  it("passes through admin gate failures", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const req = new NextRequest("http://localhost/api/admin/themenradar");
    const res = await LIST_GET(req);
    expect(res.status).toBe(403);
  });
});
