import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import { requireAdminOrEditor } from "@/app/api/feeds/_auth";

function req(
  headers?: Record<string, string>,
  pathname = "/api/feeds/drafts",
) {
  return new NextRequest(`http://localhost${pathname}`, { headers });
}

describe("feeds editor token auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.EDITOR_TOKEN;
  });

  it("allows admin sessions without editor token", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue({ userId: "admin-1" });
    const gate = await requireAdminOrEditor(req());
    expect(gate).toBeNull();
  });

  it("denies non-admin requests when no valid editor token is presented", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";
    const gate = await requireAdminOrEditor(req());
    expect(gate).toBeInstanceOf(Response);
    expect((gate as Response).status).toBe(403);
  });

  it("allows bearer token when it matches EDITOR_TOKEN", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";
    const gate = await requireAdminOrEditor(
      req({ authorization: "Bearer editor-secret" }),
    );
    expect(gate).toBeNull();
  });

  it("allows editor token only on allowlisted feed/diag routes", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";

    const allowedGate = await requireAdminOrEditor(
      req({ authorization: "Bearer editor-secret" }, "/api/_diag/gpt"),
    );
    expect(allowedGate).toBeNull();

    const deniedGate = await requireAdminOrEditor(
      req({ authorization: "Bearer editor-secret" }, "/api/admin/research/tasks"),
    );
    expect(deniedGate).toBeInstanceOf(Response);
    expect((deniedGate as Response).status).toBe(403);
  });

  it("treats trailing slash paths as allowlisted when route matches", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";
    const gate = await requireAdminOrEditor(
      req({ authorization: "Bearer editor-secret" }, "/api/feeds/drafts/"),
    );
    expect(gate).toBeNull();
  });

  it("allows x-editor-token header when it matches EDITOR_TOKEN", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";
    const gate = await requireAdminOrEditor(
      req({ "x-editor-token": "editor-secret" }),
    );
    expect(gate).toBeNull();
  });

  it("allows editor_token cookie when it matches EDITOR_TOKEN", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";
    const gate = await requireAdminOrEditor(
      req({ cookie: "editor_token=editor-secret" }),
    );
    expect(gate).toBeNull();
  });

  it("keeps denied response for wrong editor token", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    process.env.EDITOR_TOKEN = "editor-secret";
    const gate = await requireAdminOrEditor(
      req({ authorization: "Bearer wrong-secret" }),
    );
    expect(gate).toBeInstanceOf(Response);
    expect((gate as Response).status).toBe(403);
  });
});
