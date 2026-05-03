import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  createContentPrepForThemenradarItem: vi.fn(),
  createShareReadyForThemenradarItem: vi.fn(),
  createThemenradarManualExport: vi.fn(),
  applyThemenradarTelemetry: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/themenradar/store", () => ({
  createContentPrepForThemenradarItem: (...args: unknown[]) =>
    mocks.createContentPrepForThemenradarItem(...args),
  createShareReadyForThemenradarItem: (...args: unknown[]) =>
    mocks.createShareReadyForThemenradarItem(...args),
  createThemenradarManualExport: (...args: unknown[]) =>
    mocks.createThemenradarManualExport(...args),
  applyThemenradarTelemetry: (...args: unknown[]) =>
    mocks.applyThemenradarTelemetry(...args),
}));

import { POST as CONTENT_PREP_POST } from "@/app/api/admin/themenradar/[id]/content-prep/route";
import { POST as EXPORT_POST } from "@/app/api/admin/themenradar/[id]/export/route";
import { POST as SHARE_READY_POST } from "@/app/api/admin/themenradar/[id]/share-ready/route";
import { POST as TELEMETRY_POST } from "@/app/api/admin/themenradar/[id]/telemetry/route";

describe("/api/admin/themenradar/[id] action routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    mocks.createContentPrepForThemenradarItem.mockReturnValue({
      item: { id: "thema_1", lifecycleStatus: "content_ready" },
    });
    mocks.createShareReadyForThemenradarItem.mockReturnValue({
      item: { id: "thema_1", lifecycleStatus: "review_ready" },
    });
    mocks.createThemenradarManualExport.mockReturnValue({
      format: "post",
      manualReleaseOnly: true,
      reviewRequired: true,
      autoPostEligible: false,
      officialSocialAutoPosting: false,
      source: { itemId: "thema_1", lifecycleStatus: "review_ready" },
      payload: { kind: "post", title: "Thema", hook: "Hook", caption: "Caption", cta: "CTA", reviewHint: "Hint" },
    });
    mocks.applyThemenradarTelemetry.mockReturnValue({
      id: "thema_1",
      telemetrySnapshot: { clicks: 1, leads: 0, memberships: 0 },
    });
  });

  it("creates content prep details", async () => {
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/content-prep", {
      method: "POST",
    });
    const res = await CONTENT_PREP_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(200);
    expect(mocks.createContentPrepForThemenradarItem).toHaveBeenCalledWith(
      "thema_1",
      expect.objectContaining({ userId: "admin-1" }),
    );
  });

  it("maps locked content-prep states to 409", async () => {
    mocks.createContentPrepForThemenradarItem.mockImplementation(() => {
      throw new Error("themenradar_content_prep_locked");
    });
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/content-prep", {
      method: "POST",
    });
    const res = await CONTENT_PREP_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(409);
  });

  it("maps share-ready qualification violations to 409", async () => {
    mocks.createShareReadyForThemenradarItem.mockImplementation(() => {
      throw new Error("themenradar_not_qualified_for_share_ready");
    });
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/share-ready", {
      method: "POST",
    });
    const res = await SHARE_READY_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "themenradar_not_qualified_for_share_ready",
    });
  });

  it("creates manual export drafts for supported formats", async () => {
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format: "post" }),
    });
    const res = await EXPORT_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(200);
    expect(mocks.createThemenradarManualExport).toHaveBeenCalledWith(
      "thema_1",
      "post",
      expect.objectContaining({ userId: "admin-1" }),
    );
  });

  it("rejects invalid export formats", async () => {
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format: "pdf" }),
    });
    const res = await EXPORT_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_export_format",
    });
    expect(mocks.createThemenradarManualExport).not.toHaveBeenCalled();
  });

  it("maps export review-boundary violations to 409", async () => {
    mocks.createThemenradarManualExport.mockImplementation(() => {
      throw new Error("themenradar_export_requires_review_ready");
    });
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ format: "script" }),
    });
    const res = await EXPORT_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "themenradar_export_requires_review_ready",
    });
  });

  it("validates telemetry event types", async () => {
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "unknown" }),
    });
    const res = await TELEMETRY_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(400);
    expect(mocks.applyThemenradarTelemetry).not.toHaveBeenCalled();
  });

  it("rejects telemetry payloads with tracking identifiers", async () => {
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "click", sessionId: "sess_123" }),
    });
    const res = await TELEMETRY_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "tracking_fields_not_allowed",
    });
    expect(mocks.applyThemenradarTelemetry).not.toHaveBeenCalled();
  });

  it("passes through auth gate failures", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const req = new NextRequest("http://localhost/api/admin/themenradar/thema_1/share-ready", {
      method: "POST",
    });
    const res = await SHARE_READY_POST(req, {
      params: Promise.resolve({ id: "thema_1" }),
    });
    expect(res.status).toBe(403);
  });
});
