import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/runden/entry/route";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock("@features/topicRound/entrySource", () => ({
  listRundenEntryItems: (...args: unknown[]) => mocks.list(...args),
}));

describe("runden entry route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns productive entries", async () => {
    mocks.list.mockResolvedValue([
      {
        id: "65f000000000000000000011",
        title: "Produktive Runde",
        entryHref: "/create?mode=source",
        outputStatus: "review",
      },
    ]);

    const res = await GET(new Request("http://localhost/api/runden/entry?limit=10"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      items: [
        {
          id: "65f000000000000000000011",
          title: "Produktive Runde",
        },
      ],
    });
    expect(mocks.list).toHaveBeenCalledWith({ limit: 10 });
  });

  it("rejects invalid limit", async () => {
    const res = await GET(new Request("http://localhost/api/runden/entry?limit=abc"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_limit" });
  });

  it("maps source failures to stable route error", async () => {
    mocks.list.mockRejectedValue(new Error("round_entry_source_unavailable"));

    const res = await GET(new Request("http://localhost/api/runden/entry"));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "round_entry_source_unavailable",
    });
  });
});
