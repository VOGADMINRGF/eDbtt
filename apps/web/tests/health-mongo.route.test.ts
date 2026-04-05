import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mongoPing: vi.fn(),
}));

vi.mock("@/utils/mongoPing", () => ({
  mongoPing: (...args: unknown[]) => mocks.mongoPing(...args),
}));

import { GET } from "@/app/api/health/mongo/route";

describe("/api/health/mongo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns connected runtime payload when mongo ping succeeds", async () => {
    mocks.mongoPing.mockResolvedValue(true);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      service: "mongo:core",
      runtime: "connected",
    });
    expect(mocks.mongoPing).toHaveBeenCalledWith("core");
  });

  it("returns classified runtime failure for DNS/SRV/connection errors", async () => {
    mocks.mongoPing.mockRejectedValue(
      Object.assign(new Error("getaddrinfo EAI_AGAIN cluster.local"), {
        code: "EAI_AGAIN",
      }),
    );

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("mongo_runtime_failure");
    expect(body.service).toBe("mongo:core");
    expect(body.mongoRuntime).toMatchObject({
      kind: "dns",
      code: "EAI_AGAIN",
    });
  });
});
