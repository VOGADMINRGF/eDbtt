import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: vi.fn(async () => ({ uid: "admin-1" })),
}));

describe("admin analytics summary route contract", () => {
  it("returns stable not-implemented envelope for authorized access", async () => {
    const { GET: getSummary } = await import("../src/app/api/admin/analytics/summary/route");
    const res = await getSummary(new Request("http://localhost/api/admin/analytics/summary") as any);
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body).toEqual({ ok: false, reason: "not-implemented" });
  });
});
