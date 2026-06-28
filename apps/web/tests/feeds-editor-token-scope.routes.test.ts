import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrEditor: vi.fn(),
  loadFeeds: vi.fn(async () => []),
  collectFeedRefs: vi.fn(() => []),
  filterFeedRefsByRegion: vi.fn((_refs: unknown[]) => []),
  findCandidateHashes: vi.fn(async () => new Set<string>()),
  saveFeedItemsRaw: vi.fn(async () => undefined),
  upsertStatementCandidates: vi.fn(async () => undefined),
  statementCandidatesCol: vi.fn(async () => ({
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        limit: vi.fn(() => ({
          toArray: vi.fn(async () => [
            {
              id: "cand-1",
              sourceTitle: "Quelle",
              sourceUrl: "https://example.org/source",
              analyzeStatus: "pending",
              analyzeError: null,
              createdAt: "2026-03-27T00:00:00.000Z",
              publishedAt: null,
            },
          ]),
        })),
      })),
    })),
  })),
  analyzePendingStatementCandidates: vi.fn(async () => ({
    processed: 1,
    queued: 0,
    failed: 0,
  })),
  recordFeedRuntimeRun: vi.fn(async () => undefined),
}));

vi.mock("@/app/api/feeds/_auth", () => ({
  requireAdminOrEditor: (...args: unknown[]) => mocks.requireAdminOrEditor(...args),
}));

vi.mock("@features/feeds/feedConfig", () => ({
  normalizeFeedUrl: (value: string) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return null;
    if (!/^https?:\/\//i.test(trimmed)) return null;
    return trimmed;
  },
  loadFeeds: (...args: unknown[]) => mocks.loadFeeds(...args),
  collectFeedRefs: (...args: unknown[]) => mocks.collectFeedRefs(...args),
}));

vi.mock("@/lib/region/filters", () => ({
  filterFeedRefsByRegion: (...args: unknown[]) => mocks.filterFeedRefsByRegion(...args),
}));

vi.mock("@features/feeds/storage", () => ({
  findCandidateHashes: (...args: unknown[]) => mocks.findCandidateHashes(...args),
  saveFeedItemsRaw: (...args: unknown[]) => mocks.saveFeedItemsRaw(...args),
  upsertStatementCandidates: (...args: unknown[]) => mocks.upsertStatementCandidates(...args),
}));

vi.mock("@features/feeds/db", () => ({
  statementCandidatesCol: (...args: unknown[]) => mocks.statementCandidatesCol(...args),
}));

vi.mock("@features/feeds/analyzePending", () => ({
  analyzePendingStatementCandidates: (...args: unknown[]) =>
    mocks.analyzePendingStatementCandidates(...args),
}));

vi.mock("@features/feeds/runtimeLog", () => ({
  recordFeedRuntimeRun: (...args: unknown[]) => mocks.recordFeedRuntimeRun(...args),
}));

import { POST as pullPOST } from "@/app/api/feeds/pull/route";
import { POST as batchPOST } from "@/app/api/feeds/batch/route";
import { GET as candidatesGET } from "@/app/api/feeds/candidates/route";
import { POST as analyzePendingPOST } from "@/app/api/feeds/analyze-pending/route";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe("feeds editor-token scope route contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recordFeedRuntimeRun.mockResolvedValue(undefined);
  });

  it("blocks /api/feeds/pull when gate denies access", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(new Response("forbidden", { status: 403 }));

    const res = await pullPOST(
      req("http://localhost/api/feeds/pull", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope: "de", dryRun: true }),
      }),
    );

    expect(res.status).toBe(403);
    expect(mocks.loadFeeds).not.toHaveBeenCalled();
  });

  it("blocks /api/feeds/batch when gate denies access", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(new Response("forbidden", { status: 403 }));

    const res = await batchPOST(
      req("http://localhost/api/feeds/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [{ url: "https://example.org/a", title: "Signal A" }] }),
      }),
    );

    expect(res.status).toBe(403);
    expect(mocks.findCandidateHashes).not.toHaveBeenCalled();
    expect(mocks.upsertStatementCandidates).not.toHaveBeenCalled();
  });

  it("keeps /api/feeds/batch allow-path unchanged when gate allows", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(null);

    const res = await batchPOST(
      req("http://localhost/api/feeds/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              url: "https://example.org/a",
              title: "Signal A",
              summary: "Kurzbeschreibung",
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.normalized).toBe(1);
    expect(body?.inserted).toBe(1);
  });

  it("blocks /api/feeds/candidates when gate denies access", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(new Response("forbidden", { status: 403 }));

    const res = await candidatesGET(req("http://localhost/api/feeds/candidates?limit=10"));
    expect(res.status).toBe(403);
    expect(mocks.statementCandidatesCol).not.toHaveBeenCalled();
  });

  it("keeps /api/feeds/candidates allow-path unchanged when gate allows", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(null);

    const res = await candidatesGET(req("http://localhost/api/feeds/candidates?limit=10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.count).toBe(1);
  });

  it("blocks /api/feeds/analyze-pending when gate denies access", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(new Response("forbidden", { status: 403 }));

    const res = await analyzePendingPOST(
      req("http://localhost/api/feeds/analyze-pending", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      }),
    );
    expect(res.status).toBe(403);
    expect(mocks.analyzePendingStatementCandidates).not.toHaveBeenCalled();
  });

  it("keeps /api/feeds/analyze-pending allow-path unchanged when gate allows", async () => {
    mocks.requireAdminOrEditor.mockResolvedValue(null);

    const res = await analyzePendingPOST(
      req("http://localhost/api/feeds/analyze-pending", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.processed).toBe(1);
    expect(body?.failed).toBe(0);
  });
});
