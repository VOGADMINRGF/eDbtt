import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  mongoPing: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@/utils/mongoPing", () => ({
  mongoPing: (...args: unknown[]) => mocks.mongoPing(...args),
}));

import { GET } from "@/app/api/admin/system/ping/route";

function req() {
  return new NextRequest("http://localhost/api/admin/system/ping", { method: "GET" });
}

describe("/api/admin/system/ping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ ok: true });
    delete process.env.REDIS_URL;
    delete process.env.NEO4J_URI;
  });

  it("reports mongo services as healthy when ping succeeds", async () => {
    mocks.mongoPing.mockResolvedValue(true);

    const res = await GET(req());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.services).toEqual([
      { name: "mongo:core", ok: true },
      { name: "mongo:votes", ok: true },
      { name: "mongo:pii", ok: true },
    ]);
    expect(mocks.mongoPing).toHaveBeenCalledTimes(3);
  });

  it("keeps ping response deterministic with classified mongo failure", async () => {
    mocks.mongoPing
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(
        Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:27017"), {
          code: "ECONNREFUSED",
        }),
      )
      .mockResolvedValueOnce(true);

    const res = await GET(req());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(false);

    const votes = body.services.find((entry: any) => entry.name === "mongo:votes");
    expect(votes).toMatchObject({
      ok: false,
      mongoRuntime: {
        kind: "conn_refused",
        code: "ECONNREFUSED",
      },
    });
  });
});
