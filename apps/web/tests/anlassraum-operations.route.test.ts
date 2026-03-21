import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  listOperations: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@/features/anlassraumOperationsRead", async () => {
  const actual = await vi.importActual<typeof import("@/features/anlassraumOperationsRead")>(
    "@/features/anlassraumOperationsRead",
  );
  return {
    ...actual,
    listAnlassraumOperations: (...args: unknown[]) => mocks.listOperations(...args),
  };
});

import { GET as operationsGET } from "@/app/api/admin/anlassraeume/route";

const gateAccess = {
  user: { _id: { toHexString: () => "u-admin" } },
  roles: ["admin"],
  actor: {
    userId: "u-admin",
    role: "admin",
    isAdmin: true,
    scopedOwnerIds: [],
    scopedEntityIds: [],
    personTrust: "verified",
  },
};

function req(url: string) {
  return new NextRequest(url);
}

describe("anlassraum operations route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("returns read-only operations payload", async () => {
    mocks.listOperations.mockResolvedValue({
      items: [
        {
          id: "65f000000000000000000111",
          title: "Anlass A",
        },
      ],
      total: 1,
      page: 2,
      limit: 10,
      hasMore: false,
      filters: { q: "anlass", status: "all", scope: "all" },
      scan: { scanned: 12, visible: 8 },
    });

    const res = await operationsGET(
      req("http://localhost/api/admin/anlassraeume?q=anlass&page=2&limit=10"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      total: 1,
      page: 2,
      limit: 10,
      hasMore: false,
      filters: { q: "anlass", status: "all", scope: "all" },
      scan: { scanned: 12, visible: 8 },
    });
    expect(mocks.listOperations).toHaveBeenCalledTimes(1);
  });

  it("maps invalid filters and forbidden gate", async () => {
    let res = await operationsGET(req("http://localhost/api/admin/anlassraeume?status=broken"));
    expect(res.status).toBe(400);

    mocks.requireGate.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "forbidden_governance_role" }), { status: 403 }),
    );
    res = await operationsGET(req("http://localhost/api/admin/anlassraeume"));
    expect(res.status).toBe(403);
  });
});
