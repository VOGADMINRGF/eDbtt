import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const draftRows = [
    {
      _id: "draft-1",
      title: "Signal 1",
      sourceUrl: "https://example.org/1",
      claims: [{ text: "a" }, { text: "b" }],
      createdAt: "2026-03-27T00:00:00.000Z",
      status: "queued",
    },
  ];

  return {
    requireAdminOrEditor: vi.fn(),
    voteDraftsCol: vi.fn(async () => ({
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            toArray: vi.fn(async () => draftRows),
          })),
        })),
      })),
    })),
    callOpenAI: vi.fn(async () => ({
      text: { ok: true, echo: "hi" },
      raw: { model: "gpt-test" },
    })),
  };
});

vi.mock("@/app/api/feeds/_auth", () => ({
  requireAdminOrEditor: (...args: unknown[]) => mocks.requireAdminOrEditor(...args),
}));

vi.mock("@features/feeds/db", () => ({
  voteDraftsCol: (...args: unknown[]) => mocks.voteDraftsCol(...args),
}));

vi.mock("@features/ai/providers/openai", () => ({
  callOpenAI: (...args: unknown[]) => mocks.callOpenAI(...args),
}));

import { GET as draftsGET } from "@/app/api/feeds/drafts/route";
import { GET as diagGptGET } from "@/app/api/_diag/gpt/route";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe("feeds/diag routes use editor-token gate contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks /api/feeds/drafts when gate denies access", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(new Response("forbidden", { status: 403 }));

    const res = await draftsGET(req("http://localhost/api/feeds/drafts"));
    expect(res.status).toBe(403);
    expect(mocks.voteDraftsCol).not.toHaveBeenCalled();
  });

  it("keeps /api/feeds/drafts allow-path unchanged when gate allows", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(null);

    const res = await draftsGET(req("http://localhost/api/feeds/drafts?limit=20"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.count).toBe(1);
    expect(body?.items?.[0]?.id).toBe("draft-1");
  });

  it("blocks /api/_diag/gpt when gate denies access", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(new Response("forbidden", { status: 403 }));

    const res = await diagGptGET(req("http://localhost/api/_diag/gpt"));
    expect(res.status).toBe(403);
    expect(mocks.callOpenAI).not.toHaveBeenCalled();
  });

  it("keeps /api/_diag/gpt allow-path unchanged when gate allows", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(null);

    const res = await diagGptGET(req("http://localhost/api/_diag/gpt"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.model).toBe("gpt-test");
    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1);
  });
});
