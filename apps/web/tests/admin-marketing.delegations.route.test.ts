import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryMarketingDelegationRepository,
  setMarketingDelegationRepositoryForTests,
} from "@/features/marketing/delegations/repository";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import * as route from "@/app/api/admin/marketing/delegations/route";

function request(method: "GET" | "POST", body?: unknown) {
  return new NextRequest("http://localhost/api/admin/marketing/delegations", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/admin/marketing/delegations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    setMarketingDelegationRepositoryForTests(createInMemoryMarketingDelegationRepository());
  });

  afterEach(() => {
    setMarketingDelegationRepositoryForTests(null);
  });

  it("passes through the shared admin and 2FA gate", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(
      Response.json({ ok: false, error: "two_factor_required" }, { status: 403 }),
    );

    const response = await route.POST(
      request("POST", {
        itemType: "campaign",
        itemId: "CAM-CONTENT-02",
        agentRole: "marketing_operator",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "two_factor_required" });
  });

  it("creates and returns a persistent-shape delegation for an admitted admin", async () => {
    const response = await route.POST(
      request("POST", {
        itemType: "campaign",
        itemId: "CAM-CONTENT-02",
        agentRole: "content_operator",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.delegation).toMatchObject({
      itemId: "CAM-CONTENT-02",
      agentRole: "content_operator",
      status: "queued",
      requestedByUserId: "admin-1",
      autoExecute: false,
      autoPublish: false,
    });

    const listResponse = await route.GET(request("GET"));
    const listBody = await listResponse.json();
    expect(listBody.delegations).toHaveLength(1);
    expect(listBody.persistence.mode).toBe("in_memory_fallback");
  });

  it("rejects invalid roles and unknown registry items", async () => {
    const invalidRole = await route.POST(
      request("POST", {
        itemType: "campaign",
        itemId: "CAM-CONTENT-02",
        agentRole: "auto_publish_bot",
      }),
    );
    expect(invalidRole.status).toBe(400);

    const unknownItem = await route.POST(
      request("POST", {
        itemType: "campaign",
        itemId: "CAM-UNKNOWN",
        agentRole: "marketing_operator",
      }),
    );
    expect(unknownItem.status).toBe(404);
  });

  it("offers no update, delete or publishing endpoint", () => {
    expect((route as Record<string, unknown>).PATCH).toBeUndefined();
    expect((route as Record<string, unknown>).PUT).toBeUndefined();
    expect((route as Record<string, unknown>).DELETE).toBeUndefined();
  });
});
